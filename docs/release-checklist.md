# Release and App Store review checklist

## Local checks

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Install on a development store
- [ ] Complete seller settings and upload each image type
- [ ] Add the cart theme app block in the theme editor
- [ ] Activate the checkout UI extension
- [ ] Place an order with a buyer request and verify `orders/create`
- [ ] Verify issue-at-order, issue-at-fulfillment, and manual modes
- [ ] Verify PDF download, Thai characters, VAT, seller/buyer data, and invoice number
- [ ] Verify the saved invoice preview reflects seller settings and branding images
- [ ] Configure Resend in a non-production test environment and verify attachment delivery
- [ ] Uninstall and confirm merchant data cleanup

## Partner Dashboard

- [ ] Confirm the app uses Public / App Store distribution
- [ ] Request protected customer data and fields required for name, address, and email
- [ ] Create Shopify App Pricing plans from `docs/pricing.md`, including 14-day trial on paid plans
- [ ] Add app name, description, pricing, screenshots, demo store instructions, support email, privacy policy, and terms
- [ ] Configure production application URL and OAuth redirect URL
- [ ] Run Shopify automated checks
- [ ] Submit the app for review only after all mandatory compliance webhooks are deployed and reachable over HTTPS

## Review notes to include

1. The app generates seller-issued Full Tax Invoice PDFs; it does not claim e-Tax Invoice status.
2. Signature/stamp uploads are optional visual branding.
3. Protected customer data is used only to generate and send the requested invoice.
4. App charges are through Shopify App Pricing, never off-platform.
