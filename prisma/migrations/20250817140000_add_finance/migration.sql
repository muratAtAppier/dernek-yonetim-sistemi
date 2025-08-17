-- M6: Finance tables
-- Enums
CREATE TYPE "FinanceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');
CREATE TYPE "FinanceTransactionType" AS ENUM ('CHARGE', 'PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER');

-- DuesPlan
CREATE TABLE "DuesPlan" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "frequency" "FinanceFrequency" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "DuesPlan_org_name_unique" ON "DuesPlan" ("organizationId", "name");

-- DuesPeriod
CREATE TABLE "DuesPeriod" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL REFERENCES "DuesPlan"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "dueDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "DuesPeriod_plan_name_unique" ON "DuesPeriod" ("planId", "name");
CREATE INDEX "DuesPeriod_plan_dates_idx" ON "DuesPeriod" ("planId", "startDate", "endDate");

-- FinanceTransaction
CREATE TABLE "FinanceTransaction" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "memberId" TEXT REFERENCES "Member"("id") ON DELETE SET NULL,
  "type" "FinanceTransactionType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "planId" TEXT REFERENCES "DuesPlan"("id") ON DELETE SET NULL,
  "periodId" TEXT REFERENCES "DuesPeriod"("id") ON DELETE SET NULL,
  "paymentMethod" "PaymentMethod",
  "receiptNo" TEXT,
  "reference" TEXT,
  "note" TEXT,
  "txnDate" TIMESTAMP NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "FinanceTransaction_main_idx" ON "FinanceTransaction" ("organizationId", "memberId", "type", "txnDate");
