import PDFDocument from "pdfkit";
import { resolveFontPath } from "./settings.server.js";

const money = (value, currency = "THB") =>
  `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

const safe = (value, fallback = "-") => String(value || fallback);

export function renderInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fontPath = resolveFontPath();
    if (fontPath) {
      try {
        doc.font(fontPath);
      } catch {
        doc.font("Helvetica");
      }
    } else {
      doc.font("Helvetica");
    }

    const { seller, buyer, lines, totals, settings } = invoice;
    if (settings.logoDataUrl) {
      try {
        doc.image(settings.logoDataUrl, 42, 38, { fit: [90, 55] });
      } catch {
        // Ignore malformed optional branding assets and keep the invoice usable.
      }
    }

    doc.fontSize(18).text("ใบกำกับภาษี / TAX INVOICE", 150, 44, { align: "right" });
    doc.fontSize(9).text("ORIGINAL / ต้นฉบับ", 150, 70, { align: "right" });
    doc.moveTo(42, 100).lineTo(553, 100).stroke("#d1d5db");

    doc.fontSize(10).text(safe(seller.name), 42, 116);
    doc.fontSize(9).text(safe(seller.address), 42, 133, { width: 270 });
    doc.text(`Tax ID: ${safe(seller.taxId)}    Branch: ${safe(seller.branch)}`, 42, 165);
    if (seller.email || seller.phone) doc.text(`${seller.email || ""} ${seller.phone || ""}`, 42, 180);

    doc.fontSize(10).text(`Invoice No.: ${safe(invoice.invoiceNumber)}`, 360, 116);
    doc.text(`Date: ${safe(invoice.issueDate)}`, 360, 133);
    doc.text(`Order: ${safe(invoice.orderName)}`, 360, 150);

    doc.fontSize(10).text("ผู้ซื้อ / BUYER", 42, 218);
    doc.fontSize(9).text(safe(buyer.name), 42, 235);
    doc.text(safe(buyer.address), 42, 251, { width: 330 });
    doc.text(`Tax ID: ${safe(buyer.taxId)}    Branch: ${safe(buyer.branch)}`, 42, 286);

    const tableTop = 322;
    doc.rect(42, tableTop, 511, 24).fillAndStroke("#f3f4f6", "#d1d5db");
    doc.fillColor("#111827").fontSize(9);
    doc.text("Description / รายการ", 50, tableTop + 8);
    doc.text("Qty", 330, tableTop + 8);
    doc.text("Unit", 380, tableTop + 8);
    doc.text("Amount", 475, tableTop + 8);
    doc.fillColor("#111827");

    let y = tableTop + 34;
    lines.forEach((line) => {
      doc.text(safe(line.title), 50, y, { width: 250 });
      doc.text(String(line.quantity), 330, y);
      doc.text(money(line.unitPrice, totals.currency), 375, y, { width: 85, align: "right" });
      doc.text(money(line.amount, totals.currency), 468, y, { width: 80, align: "right" });
      y += 22;
    });
    doc.moveTo(42, y).lineTo(553, y).stroke("#d1d5db");
    y += 16;
    doc.text("Subtotal / มูลค่าก่อนภาษี", 330, y);
    doc.text(money(totals.subtotal, totals.currency), 468, y, { width: 80, align: "right" });
    y += 20;
    doc.text(`VAT ${safe(settings.vatRate, "7")}% / ภาษีมูลค่าเพิ่ม`, 330, y);
    doc.text(money(totals.vat, totals.currency), 468, y, { width: 80, align: "right" });
    y += 24;
    doc.fontSize(11).text("Total / รวมทั้งสิ้น", 330, y);
    doc.text(money(totals.total, totals.currency), 468, y, { width: 80, align: "right" });

    const footerY = 700;
    if (settings.signatureDataUrl) {
      try {
        doc.image(settings.signatureDataUrl, 120, footerY - 18, { fit: [120, 55] });
      } catch {
        // Optional image assets should never prevent invoice generation.
      }
    }
    if (settings.stampDataUrl) {
      try {
        doc.image(settings.stampDataUrl, 360, footerY - 18, { fit: [100, 70] });
      } catch {
        // Optional image assets should never prevent invoice generation.
      }
    }
    doc.fontSize(9).text("Authorized signature / ลายมือชื่อผู้มีอำนาจลงนาม", 88, footerY + 42);
    doc.text("Company stamp / ตราประทับบริษัท (optional)", 350, footerY + 42);
    doc.fontSize(8).fillColor("#6b7280").text(
      "This document is a seller-issued Full Tax Invoice PDF. It is not an e-Tax Invoice unless the seller has completed the required Revenue Department process.",
      42,
      790,
      { width: 511 },
    );
    doc.end();
  });
}
