export default function AdditionalPage() {
  return (
    <s-page heading="Implementation notes">
      <s-section heading="Customer request coverage">
        <s-paragraph>The theme app block works on the cart page. The checkout UI extension provides a second request path for merchants that use express checkout or place the block elsewhere in checkout.</s-paragraph>
        <s-paragraph>Both paths store the request as cart/order attributes. The order webhook links the request to the Shopify order, then issues when the selected timing is reached.</s-paragraph>
      </s-section>
      <s-section heading="Tax and e-Tax boundary">
        <s-paragraph>Full Tax Invoice fields, Thai VAT calculation, invoice numbering, PDF delivery, signature image, and company stamp image are supported.</s-paragraph>
        <s-paragraph>A signature image is visual branding only. Formal e-Tax Invoice requires a certificate/private key workflow and Revenue Department or provider submission; it is intentionally not represented as complete in this MVP.</s-paragraph>
      </s-section>
      <s-section slot="aside" heading="Next steps"><s-unordered-list><s-list-item>Request protected customer data access in Partner Dashboard</s-list-item><s-list-item>Set RESEND_API_KEY and EMAIL_FROM in production</s-list-item><s-list-item>Add Shopify App Pricing plans from the documented pricing sheet</s-list-item></s-unordered-list></s-section>
    </s-page>
  );
}
