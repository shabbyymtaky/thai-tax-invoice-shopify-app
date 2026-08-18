import { authenticate } from "../shopify.server";
import db from "../db.server";
import { issueInvoiceForRequest } from "../lib/invoice.server";
import { getSettings } from "../lib/settings.server";

export const action = async ({ request }) => {
  const { payload, shop } = await authenticate.webhook(request);
  const settings = await getSettings(shop);
  if (settings.issueTiming !== "fulfilled") return new Response("No fulfillment issue configured");
  const orderId = payload.order_id || payload.order?.id;
  const orderGid = String(orderId || "").startsWith("gid://") ? String(orderId) : `gid://shopify/Order/${orderId}`;
  const requestItem = await db.taxInvoiceRequest.findFirst({ where: { shop, orderGid } });
  if (!requestItem || requestItem.status === "issued") return new Response("No pending tax invoice request");
  try {
    await issueInvoiceForRequest(requestItem);
    return new Response("OK");
  } catch (error) {
    await db.taxInvoiceRequest.update({ where: { id: requestItem.id }, data: { status: "error", errorMessage: error.message } });
    return new Response("Invoice processing failed", { status: 500 });
  }
};

export default function FulfillmentsCreateWebhook() { return null; }
