-- DropIndex
DROP INDEX "transactions_barbershopId_idx";

-- CreateIndex
CREATE INDEX "audit_logs_barbershopId_createdAt_idx" ON "audit_logs"("barbershopId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_barbershopId_date_idx" ON "transactions"("barbershopId", "date");
