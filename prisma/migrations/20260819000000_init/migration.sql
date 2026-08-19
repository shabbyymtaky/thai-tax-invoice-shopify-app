-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSettings" (
    "id" TEXT NOT NULL,
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
    "emailDeliveryMode" TEXT NOT NULL DEFAULT 'shopify_link',
    "logoDataUrl" TEXT,
    "signatureDataUrl" TEXT,
    "stampDataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoiceRequest" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "orderGid" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSettings_shop_key" ON "MerchantSettings"("shop");

-- CreateIndex
CREATE INDEX "TaxInvoiceRequest_shop_status_idx" ON "TaxInvoiceRequest"("shop", "status");

-- CreateIndex
CREATE INDEX "TaxInvoiceRequest_shop_cartToken_idx" ON "TaxInvoiceRequest"("shop", "cartToken");

-- CreateIndex
CREATE INDEX "TaxInvoiceRequest_shop_orderGid_idx" ON "TaxInvoiceRequest"("shop", "orderGid");

-- CreateIndex
CREATE INDEX "TaxInvoiceRequest_shop_orderName_idx" ON "TaxInvoiceRequest"("shop", "orderName");

-- CreateIndex
CREATE INDEX "TaxInvoice_shop_createdAt_idx" ON "TaxInvoice"("shop", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_shop_orderGid_key" ON "TaxInvoice"("shop", "orderGid");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_shop_invoiceNumber_key" ON "TaxInvoice"("shop", "invoiceNumber");

