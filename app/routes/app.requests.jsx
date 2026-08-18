import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { findRequest, issueInvoiceForRequest } from "../lib/invoice.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const [requests, invoices] = await Promise.all([
    db.taxInvoiceRequest.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" } }),
    db.taxInvoice.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" } }),
  ]);
  return { requests, invoices };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const item = await findRequest(session.shop, String(form.get("requestId") || ""));
  if (!item) return { ok: false, error: "Request not found" };
  try {
    await issueInvoiceForRequest(item);
    return { ok: true };
  } catch (error) {
    await db.taxInvoiceRequest.update({ where: { id: item.id }, data: { status: "error", errorMessage: error.message } });
    return { ok: false, error: error.message };
  }
};

export default function RequestsPage() {
  const { requests, invoices } = useLoaderData();
  const actionData = useActionData();
  return (
    <s-page heading="Tax Invoice requests">
      {actionData?.ok && <s-banner tone="success" heading="Invoice issued">The invoice was generated and emailed when email credentials are configured.</s-banner>}
      {actionData?.error && <s-banner tone="critical" heading="Could not issue invoice">{actionData.error}</s-banner>}
      <s-section heading="Customer requests">
        {requests.length === 0 ? <s-paragraph>No requests yet.</s-paragraph> : requests.map((item) => (
          <s-stack key={item.id} direction="inline" justifyContent="space-between" gap="base">
            <s-stack direction="block" gap="small"><s-text>{item.buyerName} · {item.customerEmail}</s-text><s-text>{item.orderName || "Waiting for order"}</s-text><s-text>{item.buyerTaxId ? `Tax ID ${item.buyerTaxId} · Branch ${item.buyerBranch || "00000"}` : "Individual buyer"}</s-text>{item.errorMessage && <s-text>{item.errorMessage}</s-text>}</s-stack>
            {item.status === "issued" ? <s-badge tone="success">Issued</s-badge> : <Form method="post"><input type="hidden" name="requestId" value={item.id} /><s-button type="submit" variant="secondary" disabled={!item.orderGid}>Issue now</s-button></Form>}
          </s-stack>
        ))}
      </s-section>
      <s-section heading="Issued invoices">
        {invoices.length === 0 ? <s-paragraph>No invoices issued yet.</s-paragraph> : invoices.map((invoice) => <s-stack key={invoice.id} direction="inline" justifyContent="space-between" gap="base"><s-text>{invoice.invoiceNumber} · {invoice.orderName} · {invoice.customerEmail}</s-text><s-button href={`/app/invoices/${invoice.id}/pdf`} variant="secondary">Download PDF</s-button></s-stack>)}
      </s-section>
    </s-page>
  );
}
