# Privacy and tax boundary

## Shopify data protection

The app uses order email, billing address, buyer name, and tax details to create a requested invoice. This is protected customer data. Before App Store review, request the minimum required protected customer data and fields in Partner Dashboard, explain that the data is needed to generate and send the seller-issued invoice, and keep the privacy policy/support URL current.

The app subscribes to:

- `customers/data_request`
- `customers/redact`
- `shop/redact`

## Tax treatment

The app is a software processor acting for the merchant/seller. It does not become the seller or certify the merchant's VAT position. A company stamp image or representative signature image is optional PDF branding. It is not a cryptographic digital signature, does not create an e-Tax Invoice, and does not replace Revenue Department/provider requirements.

Merchants should have their Thai accountant confirm the invoice fields, VAT-inclusive/exclusive treatment, numbering series, correction documents, retention, and whether the selected email/print process is appropriate for their business.
