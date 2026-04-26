/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `barbershops` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `barbershops` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "barbershops_stripeCustomerId_key";

-- DropIndex
DROP INDEX "barbershops_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "barbershops" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "nextBillingDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "subscriptionStatus" SET DEFAULT 'active';
