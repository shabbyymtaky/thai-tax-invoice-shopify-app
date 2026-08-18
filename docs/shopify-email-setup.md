# Shopify standard email delivery

The default delivery mode uses Shopify's own customer notification emails. The app generates and stores the seller-issued PDF, and the email contains a link to the Shopify App Proxy download page.

## One-time merchant setup

Shopify public apps cannot automatically edit a store's notification Liquid templates. In the Shopify admin, open Settings → Notifications and paste this snippet into the Order confirmation and Shipping confirmation templates:

```liquid
{% if order.name %}
  <p><a href="{{ shop.url }}/apps/tax-invoice/download?order={{ order.name | url_encode }}">Download Tax Invoice / ดาวน์โหลดใบกำกับภาษี</a></p>
{% endif %}
```

The link opens a Shopify App Proxy page. The customer confirms the invoice email requested at checkout, and the app returns the PDF only when the order and email match. The app does not expose the PDF as a public unauthenticated file.

## Timing

- `order_created`: the invoice is available as soon as the order webhook is processed.
- `fulfilled`: the invoice is available after the fulfillment webhook is processed.
- `manual`: the link returns the invoice after the merchant issues it from Requests & invoices.

Because Shopify sends standard notifications independently from app webhooks, merchants should keep the download link in both Order confirmation and Shipping confirmation templates. For immediate guaranteed PDF attachment delivery, select the optional Resend attachment mode instead.

## Optional attachment mode

Resend can still be enabled in app settings for merchants who specifically require the PDF file attached to the email. This requires a verified sending domain and `RESEND_API_KEY`/`EMAIL_FROM` on the app server.
