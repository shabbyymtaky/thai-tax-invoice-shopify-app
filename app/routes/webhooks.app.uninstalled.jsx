import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // Delete merchant-scoped data even when the session was already removed.
  await db.$transaction([
    db.taxInvoiceRequest.deleteMany({ where: { shop } }),
    db.taxInvoice.deleteMany({ where: { shop } }),
    db.merchantSettings.deleteMany({ where: { shop } }),
    db.webhookEvent.deleteMany({ where: { shop } }),
    db.session.deleteMany({ where: { shop } }),
  ]);

  return new Response();
};
