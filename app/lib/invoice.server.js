import db from "../db.server.js";
import { sendInvoiceEmail } from "./email.server.js";
import { renderInvoicePdf } from "./pdf.server.js";
import { getSettings } from "./settings.server.js";

const text = (value, fallback = "") => (value == null ? fallback : String(value));

function addressFrom(value = {}) {
  return [value.address1, value.address2, value.city, value.province, value.zip, value.country]
    .filter(Boolean)
    .join(", ");
}

function amount(value) {
  return Number.parseFloat(value || "0") || 0;
}

function orderGid(payload) {
  return text(payload.admin_graphql_api_id || payload.admin_graphql_api_id, payload.id ? `gid://shopify/Order/${payload.id}` : "");
}

function orderName(payload) {
  return text(payload.name, payload.order_number ? `#${payload.order_number}` : `#${payload.id}`);
}

function parseNoteAttributes(payload) {
  const attrs = payload.note_attributes || payload.noteAttributes || [];
  return Object.fromEntries(attrs.map((item) => [item.name || item.key, item.value]));
}

export function shopifyTaxInvoiceLink(shop, orderName) {
  return `https://${shop}/apps/tax-invoice/download?order=${encodeURIComponent(orderName)}`;
}

export function requestFromOrderNotes(payload) {
  const notes = parseNoteAttributes(payload);
  if (notes.tax_invoice_requested !== "true") return null;
  let buyer = {};
  try {
    buyer = JSON.parse(notes.tax_invoice_buyer || "{}");
  } catch {
    buyer = {};
  }
  const billing = payload.billing_address || {};
  return {
    customerEmail: text(buyer.email || payload.email || payload.customer?.email),
    buyerType: text(buyer.buyerType, "individual"),
    buyerName: text(buyer.name || payload.billing_address?.name || payload.customer?.first_name, "Customer"),
    buyerTaxId: text(buyer.taxId),
    buyerBranch: text(buyer.branch, "00000"),
    buyerAddress: text(buyer.address || addressFrom(billing)),
    cartToken: text(payload.cart_token),
  };
}

function buildSnapshot(payload, settings, request) {
  const billing = payload.billing_address || {};
  const currency = text(payload.currency, "THB");
  const total = amount(payload.total_price || payload.current_total_price);
  const tax = amount(payload.total_tax || payload.current_total_tax);
  const configuredVat = amount(settings.vatRate) / 100;
  const vat = tax || (settings.priceIncludesVat ? total - total / (1 + configuredVat) : total * configuredVat);
  const subtotal = amount(payload.current_subtotal_price || payload.subtotal_price) || (settings.priceIncludesVat ? total - vat : total);
  const lines = (payload.line_items || []).map((line) => {
    const quantity = Number(line.quantity || 1);
    const lineAmount = amount(line.price || line.price_set?.shop_money?.amount) * quantity;
    return {
      title: text(line.title || line.name, "Item"),
      quantity,
      unitPrice: quantity ? lineAmount / quantity : 0,
      amount: lineAmount,
      sku: text(line.sku),
    };
  });
  return {
    invoiceNumber: null,
    orderGid: orderGid(payload),
    orderName: orderName(payload),
    issueDate: new Date().toISOString().slice(0, 10),
    seller: {
      name: settings.sellerName,
      address: settings.sellerAddress,
      taxId: settings.sellerTaxId,
      branch: settings.sellerBranch,
      email: settings.sellerEmail,
      phone: settings.sellerPhone,
    },
    buyer: {
      name: request?.buyerName || billing.name || payload.customer?.default_address?.name || "Customer",
      address: request?.buyerAddress || addressFrom(billing),
      taxId: request?.buyerTaxId || "",
      branch: request?.buyerBranch || "00000",
      type: request?.buyerType || "individual",
    },
    lines,
    totals: { subtotal, vat, total, currency },
    settings: {
      vatRate: settings.vatRate,
      logoDataUrl: settings.logoDataUrl,
      signatureDataUrl: settings.signatureDataUrl,
      stampDataUrl: settings.stampDataUrl,
    },
  };
}

export async function linkOrderToRequest(shop, payload) {
  const cartToken = text(payload.cart_token);
  const existing = cartToken
    ? await db.taxInvoiceRequest.findFirst({ where: { shop, cartToken }, orderBy: { createdAt: "desc" } })
    : null;
  const noted = requestFromOrderNotes(payload);
  const request = existing || noted;
  if (!request) return null;
  const data = {
    orderGid: orderGid(payload),
    orderName: orderName(payload),
    orderJson: JSON.stringify(payload),
    status: "pending",
    ...(noted && !existing ? noted : {}),
  };
  if (existing) return db.taxInvoiceRequest.update({ where: { id: existing.id }, data });
  return db.taxInvoiceRequest.create({ data: { shop, ...request, ...data } });
}

export async function findRequest(shop, id) {
  return db.taxInvoiceRequest.findFirst({ where: { id, shop } });
}

export async function createRequest(shop, data) {
  return db.taxInvoiceRequest.create({
    data: {
      shop,
      cartToken: data.cartToken || null,
      orderGid: data.orderGid || null,
      orderName: data.orderName || null,
      customerEmail: data.customerEmail,
      buyerType: data.buyerType || "individual",
      buyerName: data.buyerName,
      buyerTaxId: data.buyerTaxId || null,
      buyerBranch: data.buyerBranch || "00000",
      buyerAddress: data.buyerAddress,
      status: data.orderJson ? "pending" : "waiting_for_order",
      orderJson: data.orderJson || null,
    },
  });
}

export async function issueInvoiceForRequest(request) {
  if (!request.orderJson || !request.orderGid) {
    throw new Error("This request is waiting for Shopify to create the order");
  }
  const payload = JSON.parse(request.orderJson);
  const settings = await getSettings(request.shop);
  const existing = await db.taxInvoice.findUnique({ where: { shop_orderGid: { shop: request.shop, orderGid: request.orderGid } } });
  if (existing) return existing;

  const invoice = await db.$transaction(async (tx) => {
    const current = await tx.taxInvoice.findUnique({ where: { shop_orderGid: { shop: request.shop, orderGid: request.orderGid } } });
    if (current) return current;
    const number = `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(6, "0")}`;
    await tx.merchantSettings.update({
      where: { shop: request.shop },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const snapshot = buildSnapshot(payload, settings, request);
    snapshot.invoiceNumber = number;
    return tx.taxInvoice.create({
      data: {
        shop: request.shop,
        orderGid: request.orderGid,
        orderName: request.orderName || orderName(payload),
        invoiceNumber: number,
        customerEmail: request.customerEmail || text(payload.email),
        snapshotJson: JSON.stringify(snapshot),
      },
    });
  });

  const snapshot = JSON.parse(invoice.snapshotJson);
  const pdf = await renderInvoicePdf(snapshot);
  let emailSentAt = invoice.emailSentAt;
  if (settings.emailDeliveryMode === "resend_attachment" && settings.autoEmail && invoice.customerEmail && !emailSentAt) {
    if (await sendInvoiceEmail({ to: invoice.customerEmail, invoiceNumber: invoice.invoiceNumber, orderName: invoice.orderName, pdf })) {
      emailSentAt = new Date();
      await db.taxInvoice.update({ where: { id: invoice.id }, data: { emailSentAt } });
    }
  }
  await db.taxInvoiceRequest.update({
    where: { id: request.id },
    data: { status: "issued", invoiceId: invoice.id, errorMessage: null },
  });
  return { ...invoice, emailSentAt, pdf, downloadUrl: shopifyTaxInvoiceLink(request.shop, invoice.orderName), deliveryMode: settings.emailDeliveryMode };
}

export async function getInvoicePdf(shop, id) {
  const invoice = await db.taxInvoice.findFirst({ where: { id, shop } });
  if (!invoice) return null;
  return { ...invoice, pdf: await renderInvoicePdf(JSON.parse(invoice.snapshotJson)) };
}

export { db, orderGid, orderName, buildSnapshot };
