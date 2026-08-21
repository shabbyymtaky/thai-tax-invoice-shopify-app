# Deployment

## Required production services

1. Cloudflare Workers + Containers can host the existing Node.js React Router server. The repository now includes `wrangler.jsonc` and `cloudflare/index.js` for this path. Containers require a Workers Paid plan, and deploying from a local machine requires a Docker daemon new enough that `docker build` runs BuildKit and accepts `--load` (Docker 23+, or any current Docker Desktop) -- Wrangler shells out to exactly that command to build the image.
2. A PostgreSQL database. The app targets PostgreSQL in every environment, including local development. Nothing in the schema is provider specific, so any PostgreSQL works; see "Choosing the database" below for which one and why.
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

### Authenticating the deploy

This app does not necessarily deploy to the same Cloudflare account as the one a
machine happens to be logged into with `wrangler login`. Rather than switching
the global login back and forth, put a scoped API token in `.env`:

```
CLOUDFLARE_API_TOKEN=...
```

Wrangler reads it from there and it takes precedence over the global OAuth
login, so this project targets the right account while other projects keep
using whatever they were using. `.env` is git-ignored.

Create the token in the owning account's dashboard from the **Edit Cloudflare
Workers** template, then add two permissions the template does not include:

| Permission | Why |
|---|---|
| Account -> Workers Scripts -> Edit | included in the template; uploads the Worker and its Durable Object |
| Account -> **Containers -> Edit** | publishes the container image and rolls out instances |
| Account -> **Cloudchamber -> Edit** | provisions the compute the container runs on |
| Zone -> Workers Routes -> Edit | included in the template; attaches the custom domain |

Omitting the Containers or Cloudchamber permission still lets the Worker upload
succeed, then fails partway through the container rollout, so confirm the token
first:

```bash
npx wrangler whoami   # must report the account that owns this app
npm run cf:dry-run    # builds the image and resolves bindings without deploying
```

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

## Choosing the database

**PlanetScale Postgres, created from the Cloudflare dashboard.** Since June 2026 Cloudflare partners with PlanetScale so the database is provisioned from Cloudflare and appears as a line item on the Cloudflare invoice, which keeps hosting and storage on one bill. Connect the container straight to the PlanetScale connection string.

There is no free tier: PlanetScale bills daily from the moment a database is created until it is deleted, whether or not it is queried. If a free tier matters more than unified billing, Neon is the drop-in alternative -- it scales to zero and its pooled endpoint behaves the same way here. Either way no code changes; only `DATABASE_URL` differs.

Whichever host is used, prefer the **pooled** connection string. The container sleeps after 10 minutes idle (`sleepAfter` in `cloudflare/index.js`) and reconnects on the next request.

### Why not Hyperdrive

[Hyperdrive](https://developers.cloudflare.com/hyperdrive/) solves connection pooling for Workers, where every request may be a fresh isolate with no connection to reuse. This app is not that: it is a long-lived Node process inside a Container, and Prisma maintains its own pool. Hyperdrive is a Workers binding and would add a hop without solving a problem this deployment has.

### Why not D1

D1 is reachable from the container -- `@cloudflare/containers` 0.2.0+ supports [outbound Workers](https://developers.cloudflare.com/containers/platform-details/outbound-traffic/), which translate plain HTTP requests from inside the container into binding calls. The blocker is Prisma, not Cloudflare: `@prisma/adapter-d1` requires a live `D1Database` binding object, which exists only inside the Workers runtime. Using D1 here would mean writing and maintaining a proxy Worker plus a custom Prisma driver adapter that speaks HTTP to it. Cloudflare's own documentation also notes that D1's built-in REST API is best suited for administrative use, because the global Cloudflare API rate limit applies to it.

Durable Object SQLite storage, also reachable over an outbound Worker, has the same problem: no Prisma support.

## Database lifecycle

The container runs `npm run setup` on boot, which is `prisma generate && prisma migrate deploy`. It applies any pending migration against `DATABASE_URL` and exits non-zero if the database is unreachable, so a misconfigured connection fails the boot instead of starting a half-working app.

There is deliberately no fallback value. `DATABASE_URL` must be set.

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
