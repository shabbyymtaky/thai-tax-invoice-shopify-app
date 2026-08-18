# Thai Tax Invoice – Shopify App

Thai-localized Shopify app for collecting buyer tax details and generating seller-issued Full Tax Invoice PDFs from Shopify orders.

## Features

- Buyer request form in cart theme block and checkout UI extension
- Thai Tax ID, branch number, registered address, and email fields
- VAT calculation, invoice prefix/numbering, Thai + English PDF
- Issue at order creation, fulfillment, or manual approval
- Optional logo, signature, and company stamp image
- Automatic email through Resend when configured
- Shopify HMAC-authenticated webhooks and App Proxy
- GDPR compliance webhook endpoints for public App Store review

## Local setup

```bash
cp .env.example .env
npm ci
npm run setup
npm run dev
```

The Shopify CLI handles the development tunnel and injects Shopify credentials when the app is linked to a development store. Set `DATABASE_URL=file:./dev.sqlite` for local development (Prisma resolves this relative to `prisma/`).

## Scope boundary

This release generates a seller-issued Full Tax Invoice PDF. It does not claim to be an official Revenue Department e-Tax Invoice. Uploaded signature/stamp images are visual branding only; they are not digital signatures.

## Documentation

See [`docs/`](./docs/) for the product spec, architecture, pricing, deployment, privacy/tax boundary, and App Store release checklist.
