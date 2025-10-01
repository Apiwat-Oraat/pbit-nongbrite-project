/*
  Warnings:

  - You are about to drop the column `lastRegenAt` on the `Life` table. All the data in the column will be lost.
  - You are about to drop the column `regenRate` on the `Life` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Life" DROP COLUMN "lastRegenAt",
DROP COLUMN "regenRate",
ADD COLUMN     "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
