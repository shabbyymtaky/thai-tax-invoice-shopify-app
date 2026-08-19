import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

/**
 * The container image is the repository's own Dockerfile, so the Node.js
 * React Router server runs unchanged. `envVars` is the only channel it has
 * for configuration -- the container does not see Worker bindings -- and it
 * is typed `Record<string, string>`, so unset optional secrets have to be
 * dropped rather than forwarded as `undefined`. Forwarding them would arrive
 * as the literal string "undefined", which reads as truthy and defeats the
 * "skip when unconfigured" guards in app/lib/email.server.js.
 */
function containerEnv(vars) {
  return Object.fromEntries(
    Object.entries(vars).filter(([, value]) => typeof value === "string" && value !== ""),
  );
}

/**
 * Runs the existing Node.js/React Router app in a Cloudflare Container.
 * Requests are pinned to one named instance so the app's session/database
 * behavior remains consistent until the database is moved to shared storage.
 */
export class TaxInvoiceContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "10m";
  envVars = containerEnv({
    NODE_ENV: env.NODE_ENV || "production",
    PORT: env.PORT || "3000",
    SCOPES: env.SCOPES || "read_orders,read_fulfillments",
    SHOPIFY_APP_URL: env.SHOPIFY_APP_URL,
    SHOPIFY_API_KEY: env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: env.SHOPIFY_API_SECRET,
    DATABASE_URL: env.DATABASE_URL,
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
  });
}

export default {
  async fetch(request, env) {
    const instance = getContainer(env.TAX_INVOICE_CONTAINER, "production");
    return instance.fetch(request);
  },
};
