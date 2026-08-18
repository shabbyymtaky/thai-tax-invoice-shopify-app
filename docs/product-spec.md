# Product specification

## MVP shipped in this repository

1. Merchant configures legal seller name, registered address, Tax ID, branch, VAT rate, invoice prefix, next number, issue timing, language, and email behavior.
2. Merchant may upload logo, signature, and company stamp images (PNG/JPEG/WebP, each up to 2 MB).
3. Buyer can request a tax invoice in a cart theme app block or through a checkout UI extension. The form supports individual/company, Tax ID, branch, registered address, and destination email.
4. `orders/create` links the buyer request to the order. The merchant can choose issue at order creation, fulfillment, or manual approval.
5. The app calculates Thai VAT, creates a numbered A4 PDF, shows it in the admin, and emails it through Resend when configured.
6. Settings includes a saved-configuration preview of the Thai + English invoice layout, including uploaded branding images.
7. Mandatory public-app privacy webhooks are registered for customer data request, customer redaction, and shop redaction.

## Operational assumptions

- This is a seller-issued Full Tax Invoice PDF. The seller remains the issuer and is responsible for the accuracy of Tax ID, branch, address, VAT treatment, invoice numbering, retention, and local tax compliance.
- `priceIncludesVat` defaults to true because Thai consumer storefronts commonly display VAT-inclusive prices. Merchants must confirm their accounting treatment.
- Email is best-effort. Without `RESEND_API_KEY` and `EMAIL_FROM`, the invoice is still generated and downloadable, but no email delivery is claimed.
- The app avoids `write_orders`, customer write scopes, and product scopes.

## Future e-Tax track

Formal e-Tax Invoice & e-Receipt is a separate product track requiring certificate/private-key custody, digital signature or approved email timestamp flow, provider/RD submission, XML/PDF-A requirements, audit logging, and legal review. It must not be enabled by merely uploading a signature image.
