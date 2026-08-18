import { authenticate } from "../shopify.server";
import { getInvoicePdf } from "../lib/invoice.server";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const invoice = await getInvoicePdf(session.shop, params.id);
  if (!invoice) return new Response("Not found", { status: 404 });
  return new Response(invoice.pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
};

export default function InvoicePdfRoute() { return null; }
