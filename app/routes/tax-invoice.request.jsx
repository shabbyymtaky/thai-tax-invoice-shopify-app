import { appProxyShop, verifyAppProxyRequest } from "../lib/app-proxy.server";
import { createRequest } from "../lib/invoice.server";
import { unauthenticated } from "../shopify.server";

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

async function findOrder(shop, orderName) {
  if (!orderName) return null;
  try {
    const { admin } = await unauthenticated.admin(shop);
    const response = await admin.graphql(`#graphql
      query FindOrder($query: String!) {
        orders(first: 1, query: $query) {
          nodes {
            id
            name
            email
            cartToken
            currencyCode
            totalPriceSet { shopMoney { amount } }
            totalTaxSet { shopMoney { amount } }
            currentSubtotalPriceSet { shopMoney { amount } }
            billingAddress { name address1 address2 city province zip country }
            lineItems(first: 100) { nodes { title quantity originalUnitPriceSet { shopMoney { amount } } } }
          }
        }
      }`, { variables: { query: `name:${orderName}` } });
    const body = await response.json();
    const order = body.data?.orders?.nodes?.[0];
    if (!order) return null;
    return {
      id: order.id.split("/").pop(),
      admin_graphql_api_id: order.id,
      name: order.name,
      email: order.email,
      cart_token: order.cartToken,
      currency: order.currencyCode,
      total_price: order.totalPriceSet?.shopMoney?.amount,
      total_tax: order.totalTaxSet?.shopMoney?.amount,
      current_subtotal_price: order.currentSubtotalPriceSet?.shopMoney?.amount,
      billing_address: order.billingAddress,
      line_items: order.lineItems.nodes.map((line) => ({ title: line.title, quantity: line.quantity, price: line.originalUnitPriceSet?.shopMoney?.amount })),
    };
  } catch {
    return null;
  }
}

export async function action({ request }) {
  if (!verifyAppProxyRequest(request)) return json({ ok: false, error: "Unauthorized" }, 401);
  const shop = appProxyShop(request);
  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);
  const form = await request.formData();
  const customerEmail = String(form.get("customerEmail") || "").trim();
  const buyerName = String(form.get("buyerName") || "").trim();
  const buyerAddress = String(form.get("buyerAddress") || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail) || !buyerName || !buyerAddress) {
    return json({ ok: false, error: "Email, buyer name, and registered address are required" }, 422);
  }
  const orderName = String(form.get("orderName") || "").trim();
  const order = orderName ? await findOrder(shop, orderName) : null;
  const created = await createRequest(shop, {
    cartToken: String(form.get("cartToken") || "").trim() || order?.cart_token,
    orderGid: order?.admin_graphql_api_id,
    orderName: order?.name || orderName,
    orderJson: order ? JSON.stringify(order) : null,
    customerEmail,
    buyerType: String(form.get("buyerType") || "individual"),
    buyerName,
    buyerTaxId: String(form.get("buyerTaxId") || "").trim(),
    buyerBranch: String(form.get("buyerBranch") || "00000").trim(),
    buyerAddress,
  });
  return json({ ok: true, requestId: created.id, message: order ? "Tax Invoice request received" : "Tax Invoice request saved for this order" });
}

export async function loader({ request }) {
  if (!verifyAppProxyRequest(request)) return new Response("Unauthorized", { status: 401 });
  return new Response("Tax Invoice request endpoint", { headers: { "Content-Type": "text/plain" } });
}

export default function PublicRequestRoute() { return null; }
