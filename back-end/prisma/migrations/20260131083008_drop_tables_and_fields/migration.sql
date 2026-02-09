/*
  Warnings:

  - You are about to drop the column `metadata` on the `GamePlayHistory` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `LevelCompletion` table. All the data in the column will be lost.
  - You are about to drop the column `isProfilePublic` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AchievementUnlock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Icon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserIcon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AchievementUnlock" DROP CONSTRAINT "AchievementUnlock_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "AchievementUnlock" DROP CONSTRAINT "AchievementUnlock_userId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayHistory" DROP CONSTRAINT "GamePlayHistory_levelId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayHistory" DROP CONSTRAINT "GamePlayHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "LastStage" DROP CONSTRAINT "LastStage_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "LastStage" DROP CONSTRAINT "LastStage_levelId_fkey";

-- DropForeignKey
ALTER TABLE "LastStage" DROP CONSTRAINT "LastStage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "LevelCompletion" DROP CONSTRAINT "LevelCompletion_levelId_fkey";

-- DropForeignKey
ALTER TABLE "LevelCompletion" DROP CONSTRAINT "LevelCompletion_userId_fkey";

-- DropForeignKey
ALTER TABLE "Life" DROP CONSTRAINT "Life_userId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "RankingCache" DROP CONSTRAINT "RankingCache_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResetToken" DROP CONSTRAINT "ResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Streak" DROP CONSTRAINT "Streak_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserIcon" DROP CONSTRAINT "UserIcon_iconId_fkey";

-- DropForeignKey
ALTER TABLE "UserIcon" DROP CONSTRAINT "UserIcon_userId_fkey";

-- AlterTable
ALTER TABLE "GamePlayHistory" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "LevelCompletion" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "isProfilePublic";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "displayName",
DROP COLUMN "isPublic",
DROP COLUMN "refreshToken";

-- DropTable
DROP TABLE "Achievement";

-- DropTable
DROP TABLE "AchievementUnlock";

-- DropTable
DROP TABLE "Icon";

-- DropTable
DROP TABLE "ResetToken";

-- DropTable
DROP TABLE "UserIcon";

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Life" ADD CONSTRAINT "Life_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastStage" ADD CONSTRAINT "LastStage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastStage" ADD CONSTRAINT "LastStage_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastStage" ADD CONSTRAINT "LastStage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelCompletion" ADD CONSTRAINT "LevelCompletion_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelCompletion" ADD CONSTRAINT "LevelCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayHistory" ADD CONSTRAINT "GamePlayHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayHistory" ADD CONSTRAINT "GamePlayHistory_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingCache" ADD CONSTRAINT "RankingCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
