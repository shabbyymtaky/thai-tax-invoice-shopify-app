# Deployment

## Required production services

1. Node.js host for the React Router server (Cloudflare Workers/Pages is possible only after a runtime-specific Prisma/storage adaptation; a Node-compatible host is the shortest path for this repository).
2. PostgreSQL or another production database. SQLite is for local/single-instance testing only.
3. Resend domain and API key for automatic email.
4. HTTPS public URL for Shopify OAuth, App Proxy, and webhooks.

## Environment variables

Set `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES=read_orders,read_fulfillments`, `DATABASE_URL`, `RESEND_API_KEY`, and `EMAIL_FROM`. Never commit `.env` or tokens.

## Build and start

```bash
npm ci
npm run setup
npm run build
NODE_ENV=production npm run start
```

Run `shopify app deploy` from the repository root after the production URL and client ID are configured. Use the Shopify CLI's app release workflow only after the dev-store walkthrough and automated checks pass.

## Cloudflare option

Cloudflare Tunnel is suitable for local development. Cloudflare R2 is a good next step for logos/signatures when the app moves beyond the MVP. The current code keeps bounded data URLs in the database to stay deployable without requiring an R2 bucket ID or secret in source control.
