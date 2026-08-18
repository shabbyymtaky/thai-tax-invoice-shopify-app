import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings, saveSettings } from "../lib/settings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { settings: await getSettings(session.shop) };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  try {
    await saveSettings(session.shop, await request.formData());
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  return (
    <s-page heading="Tax Invoice settings">
      <s-link slot="breadcrumb-actions" href="/app">Dashboard</s-link>
      {actionData?.ok && <s-banner tone="success" heading="Settings saved">New requests will use these values.</s-banner>}
      {actionData?.error && <s-banner tone="critical" heading="Could not save">{actionData.error}</s-banner>}
      <Form method="post" encType="multipart/form-data">
        <s-section heading="Seller information">
          <s-stack direction="block" gap="base">
            <s-text-field name="sellerName" label="Legal seller name" value={settings.sellerName} required></s-text-field>
            <s-text-area name="sellerAddress" label="Registered address" value={settings.sellerAddress} required></s-text-area>
            <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"><s-text-field name="sellerTaxId" label="Seller Tax ID" value={settings.sellerTaxId} required></s-text-field><s-text-field name="sellerBranch" label="Branch number" value={settings.sellerBranch}></s-text-field><s-text-field name="sellerEmail" type="email" label="Seller email" value={settings.sellerEmail}></s-text-field><s-text-field name="sellerPhone" label="Seller phone" value={settings.sellerPhone}></s-text-field></s-grid>
          </s-stack>
        </s-section>
        <s-section heading="Invoice numbering and VAT">
          <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"><s-text-field name="invoicePrefix" label="Invoice prefix" value={settings.invoicePrefix}></s-text-field><s-text-field name="nextInvoiceNumber" type="number" label="Next number" value={String(settings.nextInvoiceNumber)} min="1"></s-text-field><s-text-field name="vatRate" type="number" label="VAT rate (%)" value={settings.vatRate} min="0" step="0.01"></s-text-field><s-select name="invoiceLanguage" label="Invoice language" value={settings.invoiceLanguage}><s-option value="th-en">Thai + English</s-option><s-option value="en">English</s-option><s-option value="th">Thai</s-option></s-select></s-grid>
          <s-checkbox name="priceIncludesVat" label="Shopify prices include VAT (recommended for Thai consumer stores)" checked={settings.priceIncludesVat}></s-checkbox>
        </s-section>
        <s-section heading="Automatic issue and email">
          <s-select name="issueTiming" label="Issue invoice when" value={settings.issueTiming}><s-option value="order_created">Order is created</s-option><s-option value="fulfilled">Order is fulfilled / shipped</s-option><s-option value="manual">Merchant manually approves</s-option></s-select>
          <s-checkbox name="autoEmail" label="Automatically email the PDF to the customer's registered/request email" checked={settings.autoEmail}></s-checkbox>
          <s-paragraph>Emails are sent only when RESEND_API_KEY and EMAIL_FROM are configured on the server. Without them, the invoice is still available for download from this app.</s-paragraph>
        </s-section>
        <s-section heading="Optional branding">
          <s-paragraph>These images are printed on the PDF as visual branding. They are not cryptographic digital signatures and do not make the file an e-Tax Invoice.</s-paragraph>
          <s-stack direction="block" gap="base"><label>Company logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Authorized signature image<input name="signature" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Company stamp image<input name="stamp" type="file" accept="image/png,image/jpeg,image/webp" /></label></s-stack>
        </s-section>
        <s-button type="submit" variant="primary">Save settings</s-button>
      </Form>
    </s-page>
  );
}
