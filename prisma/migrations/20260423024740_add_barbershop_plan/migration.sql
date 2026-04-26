-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'BASIC';
