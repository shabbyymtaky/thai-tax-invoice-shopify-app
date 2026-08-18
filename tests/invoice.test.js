import assert from "node:assert/strict";
import crypto from "node:crypto";
import process from "node:process";
import test from "node:test";
import { buildSnapshot } from "../app/lib/invoice.server.js";
import { renderInvoicePdf } from "../app/lib/pdf.server.js";
import { verifyAppProxyRequest } from "../app/lib/app-proxy.server.js";

test("buildSnapshot calculates VAT-inclusive Thai totals", () => {
  const snapshot = buildSnapshot(
    {
      id: "1",
      name: "#1001",
      currency: "THB",
      total_price: "1070",
      line_items: [{ title: "สินค้า", quantity: 1, price: "1070" }],
      billing_address: { name: "Buyer", address1: "Bangkok", zip: "10110" },
    },
    { sellerName: "Seller", sellerAddress: "Bangkok", sellerTaxId: "010", sellerBranch: "00000", sellerEmail: "", sellerPhone: "", vatRate: "7", priceIncludesVat: true, logoDataUrl: null, signatureDataUrl: null, stampDataUrl: null },
    { buyerName: "Buyer Co", buyerAddress: "Bangkok", buyerTaxId: "020", buyerBranch: "00000", buyerType: "company" },
  );
  assert.equal(snapshot.totals.total, 1070);
  assert.equal(Math.round(snapshot.totals.vat * 100) / 100, 70);
  assert.equal(Math.round(snapshot.totals.subtotal * 100) / 100, 1000);
  assert.equal(snapshot.buyer.name, "Buyer Co");
});

test("PDF renderer returns a PDF for Thai invoice content", async () => {
  const pdf = await renderInvoicePdf({
    invoiceNumber: "TX-000001",
    orderName: "#1001",
    issueDate: "2026-08-18",
    seller: { name: "ผู้ขาย จำกัด", address: "กรุงเทพฯ", taxId: "010", branch: "00000", email: "", phone: "" },
    buyer: { name: "ผู้ซื้อ", address: "กรุงเทพฯ", taxId: "020", branch: "00000" },
    lines: [{ title: "สินค้า", quantity: 1, unitPrice: 1000, amount: 1000 }],
    totals: { subtotal: 934.58, vat: 65.42, total: 1000, currency: "THB" },
    settings: { vatRate: "7", logoDataUrl: null, signatureDataUrl: null, stampDataUrl: null },
  });
  assert.ok(pdf.subarray(0, 5).toString() === "%PDF-");
  assert.ok(pdf.length > 1000);
});

test("App Proxy HMAC verification rejects tampering", () => {
  process.env.SHOPIFY_API_SECRET = "test-secret";
  process.env.NODE_ENV = "production";
  const params = new URLSearchParams({ shop: "example.myshopify.com", path_prefix: "apps/tax-invoice" });
  const hmac = crypto.createHmac("sha256", "test-secret").update(new URLSearchParams([...params.entries()].sort(([a], [b]) => a.localeCompare(b))).toString()).digest("hex");
  assert.equal(verifyAppProxyRequest(new Request(`https://app.example.com/tax-invoice/request?${params}&hmac=${hmac}`)), true);
  assert.equal(verifyAppProxyRequest(new Request(`https://app.example.com/tax-invoice/request?${params}&hmac=bad`)), false);
});
