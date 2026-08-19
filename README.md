# Thai Tax Invoice – Shopify App

Thai-localized Shopify app for collecting buyer tax details and generating seller-issued Full Tax Invoice PDFs from Shopify orders.

## Features

- Buyer request form in cart theme block and checkout UI extension
- Thai Tax ID, branch number, registered address, and email fields
- VAT calculation, invoice prefix/numbering, Thai + English PDF
- Issue at order creation, fulfillment, or manual approval
- Optional logo, signature, and company stamp image
- Shopify standard email + secure PDF link (Resend PDF attachment mode is optional)
- Shopify HMAC-authenticated webhooks and App Proxy
- GDPR compliance webhook endpoints for public App Store review

## Local setup

```bash
docker run -d --name tax-invoice-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tax_invoice postgres:16-alpine
cp .env.example .env
npm ci
npm run setup
npm run dev
```

The app runs on PostgreSQL in every environment, so local development needs a database too -- the `docker run` above matches the `DATABASE_URL` already in `.env.example`. A hosted development database works just as well; point `DATABASE_URL` at it and skip the container. See [`docs/deployment.md`](./docs/deployment.md) for the production database choice.

The Shopify CLI handles the development tunnel and injects Shopify credentials when the app is linked to a development store.

## Scope boundary

This release generates a seller-issued Full Tax Invoice PDF. It does not claim to be an official Revenue Department e-Tax Invoice. Uploaded signature/stamp images are visual branding only; they are not digital signatures.

## Documentation

See [`docs/`](./docs/) for the product spec, architecture, pricing, deployment, privacy/tax boundary, and App Store release checklist.
