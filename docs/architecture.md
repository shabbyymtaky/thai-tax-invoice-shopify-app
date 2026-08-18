# Architecture and data flow

```text
Cart theme app block ─┐
                      ├─ Shopify App Proxy ──> tax-invoice request ──> SQLite/Postgres
Checkout UI extension ┘                                               │
                                                                       ▼
Shopify orders/create ──> link request ──> issue timing ──> PDF ──> Resend email
Shopify fulfillments/create ────────────────────────────────────────┘
```

## Server

- React Router 7 Shopify template with Shopify-managed OAuth/session storage through Prisma.
- Admin GraphQL is used for the after-purchase request lookup. Webhooks use Shopify's authenticated webhook helper, which validates HMAC before processing.
- Prisma models store settings, tax invoice requests, issued invoice snapshots, and webhook idempotency keys.
- PDF generation uses PDFKit and the Noto Sans Thai font package. Optional branding images are stored as bounded data URLs for the MVP; move them to R2 before high-volume production.
- Email uses Resend only when both provider credentials are configured.

## Request linking

- Before checkout, the cart token is stored and matched to `orders/create`.
- At checkout, buyer data is written to order/cart attributes and read from the order webhook's note attributes.
- After purchase, a buyer can provide an order number and email through the app proxy form; the server verifies the proxy signature and resolves the order through the shop's offline Admin session.

## Security and privacy

- App proxy HMAC is checked with constant-time comparison.
- Webhook HMAC is checked by Shopify's server package.
- Customer data is minimized to tax-invoice fields. The public app must request only the protected customer fields it needs in Partner Dashboard.
- Uninstall and shop redaction remove merchant-scoped settings, requests, invoices, events, and sessions.
