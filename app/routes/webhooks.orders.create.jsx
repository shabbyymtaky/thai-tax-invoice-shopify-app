import { authenticate } from "../shopify.server";
import db from "../db.server";
import { issueInvoiceForRequest, linkOrderToRequest } from "../lib/invoice.server";
import { getSettings } from "../lib/settings.server";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);
  const eventId = request.headers.get("x-shopify-webhook-id");
  if (eventId) {
    const existing = await db.webhookEvent.findUnique({ where: { id: eventId } });
    if (existing) return new Response("Already processed");
    await db.webhookEvent.create({ data: { id: eventId, shop, topic } });
  }
  const linked = await linkOrderToRequest(shop, payload);
  if (!linked) return new Response("No tax invoice request");
  const settings = await getSettings(shop);
  if (settings.issueTiming === "order_created") {
    try {
      await issueInvoiceForRequest(linked);
    } catch (error) {
      await db.taxInvoiceRequest.update({ where: { id: linked.id }, data: { status: "error", errorMessage: error.message } });
      return new Response("Invoice processing failed", { status: 500 });
    }
  }
  return new Response("OK");
};

export default function OrdersCreateWebhook() { return null; }
