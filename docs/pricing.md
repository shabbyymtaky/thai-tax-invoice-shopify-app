# Pricing proposal and Shopify App Pricing setup

Shopify App Pricing is the recommended billing method for a new public app. Plans are created in Partner Dashboard/App Store listing; this repository intentionally does not add off-platform billing or a custom Stripe checkout.

## Proposed launch plans

| Plan | Price | Free trial | Intended value |
|---|---:|---:|---|
| Free | ฿0/month | — | 5 invoices/month, PDF download, Thai + English template |
| Basic | ฿299/month | 14 days | 100 invoices/month, automatic email, cart request block |
| Pro | ฿599/month | 14 days | 500 invoices/month, checkout extension, fulfillment timing, branding uploads |
| Business | ฿999/month | 14 days | 2,000 invoices/month, priority support, Credit/Debit Note roadmap access |

The first launch should use a simple recurring model. Add usage-based overages only after real invoice-volume data is available; it complicates the buyer promise and support model.

## Listing copy

**Name:** Thai Tax Invoice – PDF & Email

**Subtitle:** Collect Thai buyer tax details and automatically issue seller-branded Full Tax Invoice PDFs from Shopify.

**Key bullets:**

- Thai Tax ID and branch number
- Buyer request form in cart and checkout
- VAT 7% calculation with configurable VAT-inclusive pricing
- Automatic invoice numbering and PDF email delivery
- Thai + English invoice layout
- Optional company logo, signature, and stamp image

## Important limitation

The plans must be created and reviewed in Partner Dashboard because Shopify App Pricing is hosted by Shopify. The codebase can be tested before paid plans are configured; paid access gating should be enabled only after the plan handles and the current subscription query are wired in the Partner account.
