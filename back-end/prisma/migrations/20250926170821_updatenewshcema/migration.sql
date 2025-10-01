/*
  Warnings:

  - You are about to drop the column `resetExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetPin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."LastStage" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stars" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "resetExpiresAt",
DROP COLUMN "resetPin";
