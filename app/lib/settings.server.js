import { createRequire } from "node:module";
import db from "../db.server.js";

const require = createRequire(import.meta.url);

export const DEFAULT_SETTINGS = {
  sellerName: "",
  sellerAddress: "",
  sellerTaxId: "",
  sellerBranch: "00000",
  sellerEmail: "",
  sellerPhone: "",
  invoicePrefix: "TX-",
  nextInvoiceNumber: 1,
  vatRate: "7",
  priceIncludesVat: true,
  invoiceLanguage: "th-en",
  issueTiming: "order_created",
  autoEmail: true,
  logoDataUrl: null,
  signatureDataUrl: null,
  stampDataUrl: null,
};

export async function getSettings(shop) {
  return db.merchantSettings.upsert({
    where: { shop },
    create: { shop, ...DEFAULT_SETTINGS },
    update: {},
  });
}

function value(formData, name, fallback = "") {
  const raw = formData.get(name);
  return raw == null ? fallback : String(raw).trim();
}

async function uploadDataUrl(formData, field, current) {
  const file = formData.get(field);
  if (!file || typeof file.arrayBuffer !== "function" || !file.name) {
    return current;
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error(`${field} must be 2 MB or smaller`);
  }
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error(`${field} must be PNG, JPEG, or WebP`);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function saveSettings(shop, formData) {
  const current = await getSettings(shop);
  const nextInvoiceNumber = Math.max(
    1,
    Number.parseInt(value(formData, "nextInvoiceNumber", String(current.nextInvoiceNumber)), 10) || 1,
  );

  const data = {
    sellerName: value(formData, "sellerName"),
    sellerAddress: value(formData, "sellerAddress"),
    sellerTaxId: value(formData, "sellerTaxId"),
    sellerBranch: value(formData, "sellerBranch", "00000"),
    sellerEmail: value(formData, "sellerEmail"),
    sellerPhone: value(formData, "sellerPhone"),
    invoicePrefix: value(formData, "invoicePrefix", "TX-").slice(0, 20),
    nextInvoiceNumber,
    vatRate: value(formData, "vatRate", "7"),
    priceIncludesVat: formData.get("priceIncludesVat") === "on",
    invoiceLanguage: value(formData, "invoiceLanguage", "th-en"),
    issueTiming: value(formData, "issueTiming", "order_created"),
    autoEmail: formData.get("autoEmail") === "on",
    logoDataUrl: await uploadDataUrl(formData, "logo", current.logoDataUrl),
    signatureDataUrl: await uploadDataUrl(formData, "signature", current.signatureDataUrl),
    stampDataUrl: await uploadDataUrl(formData, "stamp", current.stampDataUrl),
  };

  return db.merchantSettings.update({ where: { shop }, data });
}

export function resolveFontPath() {
  try {
    return require.resolve(
      "@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff2",
    );
  } catch {
    return null;
  }
}
