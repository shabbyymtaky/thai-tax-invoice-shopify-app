import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getSettings } from "../lib/settings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const [settings, requests, invoices] = await Promise.all([
    getSettings(session.shop),
    db.taxInvoiceRequest.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.taxInvoice.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return { settings, requests, invoices };
};

const statusTone = (status) => (status === "issued" ? "success" : status === "error" ? "critical" : "warning");

export default function Dashboard() {
  const { settings, requests, invoices } = useLoaderData();
  const pending = requests.filter((request) => request.status !== "issued").length;
  return (
    <s-page heading="Thai Tax Invoice">
      <s-button slot="primary-action" href="/app/settings">Settings</s-button>
      <s-banner tone="info" heading="Seller-issued Full Tax Invoice">
        Configure your Thai seller information, then add the customer request block to your cart theme and checkout.
        Company stamp and signature images are optional branding only; they are not digital signatures for e-Tax Invoice.
      </s-banner>
      <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))">
        <s-section heading="Requests waiting"><s-heading>{pending}</s-heading><s-link href="/app/requests">Open requests</s-link></s-section>
        <s-section heading="Invoices issued"><s-heading>{invoices.length}</s-heading><s-link href="/app/requests">View history</s-link></s-section>
        <s-section heading="Next invoice no."><s-heading>{settings.invoicePrefix}{String(settings.nextInvoiceNumber).padStart(6, "0")}</s-heading><s-link href="/app/settings">Change numbering</s-link></s-section>
      </s-grid>
      <s-section heading="Setup checklist">
        <s-unordered-list>
          <s-list-item>{settings.sellerName ? "✓" : "○"} Seller legal name and Thai Tax ID</s-list-item>
          <s-list-item>{settings.sellerAddress ? "✓" : "○"} Registered address and branch</s-list-item>
          <s-list-item>{settings.logoDataUrl ? "✓" : "○"} Optional logo, signature, and company stamp</s-list-item>
          <s-list-item>○ Add the request block in Online Store → Themes</s-list-item>
        </s-unordered-list>
        <s-stack direction="inline" gap="base"><s-button href="/app/settings">Complete settings</s-button><s-button href="/app/requests" variant="secondary">Review requests</s-button></s-stack>
      </s-section>
      <s-section heading="Recent requests">
        {requests.length === 0 ? <s-paragraph>No customer requests yet. The customer-facing form appears after you add the theme block.</s-paragraph> : requests.map((request) => (
          <s-stack key={request.id} direction="inline" justifyContent="space-between" gap="base">
            <s-stack direction="block" gap="small"><s-text>{request.buyerName} · {request.customerEmail}</s-text><s-text>{request.orderName || "Waiting for order"} · {new Date(request.createdAt).toLocaleString()}</s-text></s-stack>
            <s-badge tone={statusTone(request.status)}>{request.status}</s-badge>
          </s-stack>
        ))}
      </s-section>
      <s-section slot="aside" heading="Tax scope"><s-paragraph>This release generates a seller-issued Full Tax Invoice PDF. It does not claim Revenue Department e-Tax status.</s-paragraph><s-link href="/app/additional">Read implementation notes</s-link></s-section>
    </s-page>
  );
}
