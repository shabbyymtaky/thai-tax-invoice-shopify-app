import { Resend } from "resend";

export async function sendInvoiceEmail({ to, invoiceNumber, orderName, pdf }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn("Invoice email skipped: RESEND_API_KEY and EMAIL_FROM are required");
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject: `Tax Invoice ${invoiceNumber} for ${orderName}`,
    text: `Attached is your Tax Invoice ${invoiceNumber} for order ${orderName}.`,
    html: `<p>Attached is your Tax Invoice <strong>${invoiceNumber}</strong> for order <strong>${orderName}</strong>.</p><p>For tax treatment questions, please contact the seller shown on the invoice.</p>`,
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdf.toString("base64") }],
  });
  if (error) throw new Error(error.message || "Email provider rejected the message");
  return true;
}
