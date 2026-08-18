import crypto from "node:crypto";

export function verifyAppProxyRequest(request) {
  const secret = process.env.SHOPIFY_API_SECRET || "";
  if (!secret && process.env.NODE_ENV !== "production") return true;
  const url = new URL(request.url);
  const supplied = url.searchParams.get("hmac") || url.searchParams.get("signature") || "";
  if (!supplied) return false;
  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b));
  const message = new URLSearchParams(params).toString();
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(supplied, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function appProxyShop(request) {
  return new URL(request.url).searchParams.get("shop") || "";
}
