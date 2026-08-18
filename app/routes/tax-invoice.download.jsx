import { appProxyShop, verifyAppProxyRequest } from "../lib/app-proxy.server";
import db from "../db.server";
import { renderInvoicePdf } from "../lib/pdf.server";

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

const html = (body, status = 200) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tax Invoice download</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f6f6f7;color:#202223;margin:0;padding:32px}.card{background:#fff;border:1px solid #dfe3e8;border-radius:12px;max-width:520px;margin:0 auto;padding:28px}label{display:block;font-weight:600;margin:16px 0 6px}input{box-sizing:border-box;border:1px solid #8c9196;border-radius:6px;font-size:16px;padding:11px;width:100%}button{background:#008060;border:0;border-radius:6px;color:#fff;cursor:pointer;font-size:16px;font-weight:600;margin-top:20px;padding:12px 16px;width:100%}.error{color:#d72c0d}</style></head><body><main class="card">${body}</main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

function downloadForm(orderName, error = "", status = 200) {
  return html(`<h1>Download Tax Invoice</h1><p>Enter the email address used for this Tax Invoice request to securely download your PDF.</p>${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}<form method="post"><input type="hidden" name="order" value="${escapeHtml(orderName)}"><label for="email">Invoice email</label><input id="email" name="email" type="email" autocomplete="email" required><button type="submit">Download PDF</button></form>`, status);
}

export async function loader({ request }) {
  if (!verifyAppProxyRequest(request)) return new Response("Unauthorized", { status: 401 });
  return downloadForm(new URL(request.url).searchParams.get("order") || "");
}

export async function action({ request }) {
  if (!verifyAppProxyRequest(request)) return new Response("Unauthorized", { status: 401 });
  const shop = appProxyShop(request);
  const form = await request.formData();
  const orderName = String(form.get("order") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!shop || !orderName || !/^\S+@\S+\.\S+$/.test(email)) return downloadForm(orderName, "Enter a valid invoice email address.", 422);
  const invoice = await db.taxInvoice.findFirst({ where: { shop, orderName } });
  if (!invoice || invoice.customerEmail.toLowerCase() !== email) return downloadForm(orderName, "We could not verify this invoice request.", 422);
  const pdf = await renderInvoicePdf(JSON.parse(invoice.snapshotJson));
  return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}

export default function PublicDownloadRoute() { return null; }
