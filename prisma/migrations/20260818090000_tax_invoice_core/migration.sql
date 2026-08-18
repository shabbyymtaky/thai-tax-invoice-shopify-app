CREATE TABLE "MerchantSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "sellerName" TEXT NOT NULL DEFAULT '',
  "sellerAddress" TEXT NOT NULL DEFAULT '',
  "sellerTaxId" TEXT NOT NULL DEFAULT '',
  "sellerBranch" TEXT NOT NULL DEFAULT '00000',
  "sellerEmail" TEXT NOT NULL DEFAULT '',
  "sellerPhone" TEXT NOT NULL DEFAULT '',
  "invoicePrefix" TEXT NOT NULL DEFAULT 'TX-',
  "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
  "vatRate" TEXT NOT NULL DEFAULT '7',
  "priceIncludesVat" BOOLEAN NOT NULL DEFAULT true,
  "invoiceLanguage" TEXT NOT NULL DEFAULT 'th-en',
  "issueTiming" TEXT NOT NULL DEFAULT 'order_created',
  "autoEmail" BOOLEAN NOT NULL DEFAULT true,
  "logoDataUrl" TEXT,
  "signatureDataUrl" TEXT,
  "stampDataUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TaxInvoiceRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "cartToken" TEXT,
  "orderGid" TEXT,
  "orderName" TEXT,
  "customerEmail" TEXT NOT NULL,
  "buyerType" TEXT NOT NULL DEFAULT 'individual',
  "buyerName" TEXT NOT NULL,
  "buyerTaxId" TEXT,
  "buyerBranch" TEXT,
  "buyerAddress" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'waiting_for_order',
  "orderJson" TEXT,
  "invoiceId" TEXT,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "TaxInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "orderGid" TEXT NOT NULL,
  "orderName" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "snapshotJson" TEXT NOT NULL,
  "emailSentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "MerchantSettings_shop_key" ON "MerchantSettings"("shop");
CREATE INDEX "TaxInvoiceRequest_shop_status_idx" ON "TaxInvoiceRequest"("shop", "status");
CREATE INDEX "TaxInvoiceRequest_shop_cartToken_idx" ON "TaxInvoiceRequest"("shop", "cartToken");
CREATE INDEX "TaxInvoiceRequest_shop_orderGid_idx" ON "TaxInvoiceRequest"("shop", "orderGid");
CREATE INDEX "TaxInvoiceRequest_shop_orderName_idx" ON "TaxInvoiceRequest"("shop", "orderName");
CREATE INDEX "TaxInvoice_shop_createdAt_idx" ON "TaxInvoice"("shop", "createdAt");
CREATE UNIQUE INDEX "TaxInvoice_shop_orderGid_key" ON "TaxInvoice"("shop", "orderGid");
CREATE UNIQUE INDEX "TaxInvoice_shop_invoiceNumber_key" ON "TaxInvoice"("shop", "invoiceNumber");
