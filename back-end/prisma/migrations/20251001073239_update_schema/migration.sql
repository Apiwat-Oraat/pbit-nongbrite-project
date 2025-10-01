/*
  Warnings:

  - You are about to drop the column `totalStars` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the `Score` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScoreHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Star` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ScoreHistory" DROP CONSTRAINT "ScoreHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Star" DROP CONSTRAINT "Star_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Star" DROP CONSTRAINT "Star_userId_fkey";

-- DropIndex
DROP INDEX "public"."LevelCompletion_levelId_idx";

-- AlterTable
ALTER TABLE "public"."Chapter" DROP COLUMN "totalStars";

-- AlterTable
ALTER TABLE "public"."Level" ALTER COLUMN "maxScore" SET DEFAULT 100;

-- DropTable
DROP TABLE "public"."Score";

-- DropTable
DROP TABLE "public"."ScoreHistory";

-- DropTable
DROP TABLE "public"."Star";

-- CreateTable
CREATE TABLE "public"."GamePlayHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "GamePlayHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GamePlayHistory_userId_levelId_playedAt_idx" ON "public"."GamePlayHistory"("userId", "levelId", "playedAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."GamePlayHistory" ADD CONSTRAINT "GamePlayHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GamePlayHistory" ADD CONSTRAINT "GamePlayHistory_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
