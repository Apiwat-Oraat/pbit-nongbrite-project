/*
  Warnings:

  - You are about to drop the column `totalScore` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalStars` on the `Profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Profile_totalScore_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "totalScore",
DROP COLUMN "totalStars";

-- CreateTable
CREATE TABLE "UserStats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_totalScore_idx" ON "UserStats"("totalScore" DESC);

-- CreateIndex
CREATE INDEX "UserStats_totalStars_idx" ON "UserStats"("totalStars" DESC);

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
