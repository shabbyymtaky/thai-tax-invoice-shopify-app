import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings, saveSettings } from "../lib/settings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { settings: await getSettings(session.shop), shop: session.shop };
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
  const { settings, shop } = useLoaderData();
  const actionData = useActionData();
  const vatRate = Number(settings.vatRate || 0);
  const sampleTotal = 1070;
  const sampleNet = settings.priceIncludesVat && vatRate > 0 ? sampleTotal / (1 + vatRate / 100) : sampleTotal;
  const sampleVat = settings.priceIncludesVat ? sampleTotal - sampleNet : sampleTotal * (vatRate / 100);
  const sampleGrandTotal = settings.priceIncludesVat ? sampleTotal : sampleTotal + sampleVat;
  const exampleOrder = String(settings.nextInvoiceNumber).padStart(6, "0");
  const money = (value) => Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
          <s-select name="emailDeliveryMode" label="Invoice delivery method" value={settings.emailDeliveryMode}><s-option value="shopify_link">Shopify email + secure PDF link (recommended)</s-option><s-option value="resend_attachment">External email + PDF attachment</s-option></s-select>
          <s-checkbox name="autoEmail" label="Automatically email the PDF to the customer's registered/request email" checked={settings.autoEmail}></s-checkbox>
          <s-paragraph>Shopify link mode keeps delivery in Shopify&apos;s standard customer email flow. Resend attachment mode requires RESEND_API_KEY and EMAIL_FROM. In either mode, the invoice remains available for download from this app.</s-paragraph>
        </s-section>
        <s-section heading="Shopify email setup">
          <s-paragraph>Shopify does not allow public apps to edit notification templates automatically. Paste this snippet once in the Order confirmation and Shipping confirmation templates under Settings → Notifications.</s-paragraph>
          <pre style={{ background: "#f6f6f7", border: "1px solid #dfe3e8", borderRadius: "8px", fontSize: "12px", overflowX: "auto", padding: "14px", whiteSpace: "pre-wrap" }}>{`{% if order.name %}\n  <p><a href="{{ shop.url }}/apps/tax-invoice/download?order={{ order.name | url_encode }}">Download Tax Invoice / ดาวน์โหลดใบกำกับภาษี</a></p>\n{% endif %}`}</pre>
          <s-paragraph>Example link: {shop}/apps/tax-invoice/download?order=%23{exampleOrder}. The download page verifies the invoice email before returning the PDF.</s-paragraph>
        </s-section>
        <s-section heading="Optional branding">
          <s-paragraph>These images are printed on the PDF as visual branding. They are not cryptographic digital signatures and do not make the file an e-Tax Invoice.</s-paragraph>
          <s-stack direction="block" gap="base"><label>Company logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Authorized signature image<input name="signature" type="file" accept="image/png,image/jpeg,image/webp" /></label><label>Company stamp image<input name="stamp" type="file" accept="image/png,image/jpeg,image/webp" /></label></s-stack>
        </s-section>
        <s-section heading="Saved invoice preview">
          <s-paragraph>This preview uses the saved seller settings and a sample order. It is a visual preview; the issued PDF uses the actual Shopify order and buyer details.</s-paragraph>
          <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "12px", color: "#202223", maxWidth: "760px", padding: "28px" }}>
            <div style={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between", gap: "24px" }}>
              <div>
                {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Saved company logo" style={{ maxHeight: "52px", maxWidth: "180px", objectFit: "contain" }} /> : <div style={{ fontSize: "18px", fontWeight: 700 }}>{settings.sellerName || "Your company name"}</div>}
                <div style={{ fontSize: "12px", marginTop: "8px", whiteSpace: "pre-line" }}>{settings.sellerAddress || "Registered address"}</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Tax ID: {settings.sellerTaxId || "0000000000000"} · Branch: {settings.sellerBranch || "00000"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "20px", fontWeight: 700 }}>{settings.invoiceLanguage === "en" ? "TAX INVOICE" : "ใบกำกับภาษี"}</div>
                <div style={{ fontSize: "12px", marginTop: "6px" }}>{settings.invoicePrefix}{String(settings.nextInvoiceNumber).padStart(6, "0")}</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #dfe3e8", marginTop: "22px", paddingTop: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>Buyer / ผู้ซื้อ</div>
              <div style={{ fontSize: "12px", marginTop: "5px" }}>Sample Company Co., Ltd. · Tax ID 0105555000000 · Branch 00000</div>
              <div style={{ fontSize: "12px", marginTop: "3px" }}>99 Sample Road, Bangkok 10110</div>
            </div>
            <div style={{ borderTop: "1px solid #dfe3e8", marginTop: "20px", paddingTop: "12px" }}>
              <div style={{ display: "flex", fontSize: "12px", fontWeight: 700, justifyContent: "space-between" }}><span>Description</span><span>Amount (THB)</span></div>
              <div style={{ display: "flex", fontSize: "12px", justifyContent: "space-between", marginTop: "12px" }}><span>Sample product × 1</span><span>{money(sampleNet)}</span></div>
              <div style={{ display: "flex", fontSize: "12px", justifyContent: "space-between", marginTop: "8px" }}><span>VAT {vatRate.toFixed(2)}%</span><span>{money(sampleVat)}</span></div>
              <div style={{ borderTop: "1px solid #dfe3e8", display: "flex", fontSize: "14px", fontWeight: 700, justifyContent: "space-between", marginTop: "12px", paddingTop: "10px" }}><span>Total</span><span>{money(sampleGrandTotal)}</span></div>
            </div>
            {(settings.signatureDataUrl || settings.stampDataUrl) && <div style={{ alignItems: "flex-end", display: "flex", gap: "18px", justifyContent: "flex-end", marginTop: "20px" }}>{settings.signatureDataUrl && <img src={settings.signatureDataUrl} alt="Saved signature" style={{ maxHeight: "54px", maxWidth: "120px", objectFit: "contain" }} />}{settings.stampDataUrl && <img src={settings.stampDataUrl} alt="Saved company stamp" style={{ maxHeight: "70px", maxWidth: "90px", objectFit: "contain" }} />}</div>}
          </div>
        </s-section>
        <s-button type="submit" variant="primary">Save settings</s-button>
      </Form>
    </s-page>
  );
}
