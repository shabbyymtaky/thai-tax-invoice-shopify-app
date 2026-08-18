import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);
  if (topic === "customers/redact") {
    const email = payload.customer?.email;
    if (email) await db.taxInvoiceRequest.deleteMany({ where: { shop, customerEmail: email } });
  }
  if (topic === "shop/redact") {
    await db.$transaction([
      db.taxInvoiceRequest.deleteMany({ where: { shop } }),
      db.taxInvoice.deleteMany({ where: { shop } }),
      db.merchantSettings.deleteMany({ where: { shop } }),
      db.webhookEvent.deleteMany({ where: { shop } }),
      db.session.deleteMany({ where: { shop } }),
    ]);
  }
  // customers/data_request is acknowledged; merchants can export invoice data from the admin UI.
  return new Response("OK");
};

export default function ComplianceWebhook() { return null; }
