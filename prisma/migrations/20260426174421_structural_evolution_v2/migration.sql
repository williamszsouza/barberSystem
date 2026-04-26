/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `barbershops` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `barbershops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "cancelTimeLimit" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 50.00;

-- CreateTable
CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "barbershopId" TEXT NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_offs" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "barberId" TEXT NOT NULL,

    CONSTRAINT "time_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "barbershopId" TEXT NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_barbershopId_dayOfWeek_key" ON "business_hours"("barbershopId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "time_offs_barberId_idx" ON "time_offs"("barberId");

-- CreateIndex
CREATE INDEX "campaigns_barbershopId_idx" ON "campaigns"("barbershopId");

-- CreateIndex
CREATE UNIQUE INDEX "barbershops_stripeCustomerId_key" ON "barbershops"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "barbershops_stripeSubscriptionId_key" ON "barbershops"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
