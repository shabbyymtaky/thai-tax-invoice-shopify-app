# Deployment

## Required production services

1. Cloudflare Workers + Containers can host the existing Node.js React Router server. The repository now includes `wrangler.jsonc` and `cloudflare/index.js` for this path. Containers require a Workers Paid plan, and deploying from a local machine requires a Docker daemon new enough that `docker build` runs BuildKit and accepts `--load` (Docker 23+, or any current Docker Desktop) -- Wrangler shells out to exactly that command to build the image.
2. A PostgreSQL database. The app targets PostgreSQL in every environment, including local development. Neon is the recommended host: it is serverless, scales to zero, and its pooled endpoint tolerates a container that sleeps and reconnects. Supabase, RDS or any other PostgreSQL works -- nothing in the schema is provider specific.
3. Resend domain and API key only if PDF attachment delivery is enabled. Shopify link delivery does not require Resend.
4. HTTPS public URL for Shopify OAuth, App Proxy, secure PDF links, and webhooks.

## Environment variables

Set `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES=read_orders,read_fulfillments`, and `DATABASE_URL`. Set `RESEND_API_KEY` and `EMAIL_FROM` only for PDF attachment delivery. Never commit `.env` or tokens.

## Cloudflare Container deployment

The Cloudflare plugin used by Shopify CLI provides the development tunnel only. Production hosting uses Wrangler and Cloudflare Containers. This app is configured with the custom domain `https://tax-invoice.siamsignal.com`:

```bash
npm run cf:dry-run
npm run cf:deploy
```

Before deployment, set the production secrets in the Worker environment, including a `DATABASE_URL` pointing at the production database. The Worker routes requests to the Node container on port 3000 and enables Cloudflare observability.

Required secrets/variables:

```bash
npx wrangler secret put SHOPIFY_APP_URL
npx wrangler secret put SHOPIFY_API_KEY
npx wrangler secret put SHOPIFY_API_SECRET
npx wrangler secret put DATABASE_URL
```

`RESEND_API_KEY` and `EMAIL_FROM` are optional unless attachment delivery is enabled. The Worker passes these bindings into the container at runtime; they are not stored in `wrangler.jsonc`. Secrets that are not set are dropped rather than forwarded, so `app/lib/email.server.js` still takes its "skip when unconfigured" path instead of receiving the string `"undefined"`.

To refresh the generated Worker types after changing bindings:

```bash
npm run cf:types
```

`worker-configuration.d.ts` and `.wrangler/` are generated and git-ignored.

### Container image notes

The container runs the repository's own `Dockerfile` on `node:22-alpine`, matching `engines` and CI. It installs with `--omit=dev`, so anything the production build needs must live in `dependencies` -- that is why `vite` sits there alongside `@react-router/dev`. Wrangler is still pulled into that tree as an optional peer of `@react-router/dev`, and its bundled esbuild would otherwise collide with Vite's during `postinstall`, so `overrides.esbuild` pins both to one version.

## Database

The container runs `npm run setup` on boot, which is `prisma generate && prisma migrate deploy`. It applies any pending migration against `DATABASE_URL` and exits non-zero if the database is unreachable, so a misconfigured connection fails the boot instead of starting a half-working app.

There is deliberately no fallback value. `DATABASE_URL` must be set.

With Neon, use the **pooled** connection string. The container sleeps after 10 minutes idle (`sleepAfter` in `cloudflare/index.js`) and reconnects on the next request, which the pooler handles cleanly.

Nothing in the container's own filesystem is durable -- it is rebuilt from the image on every cold start. The database is the only place state may live.

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
