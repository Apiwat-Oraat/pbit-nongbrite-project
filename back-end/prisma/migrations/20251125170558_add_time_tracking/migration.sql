/*
  Warnings:

  - Added the required column `playTime` to the `GamePlayHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GamePlayHistory" ADD COLUMN     "playTime" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "LevelCompletion" ADD COLUMN     "bestTiem" INTEGER NOT NULL DEFAULT 999999,
ADD COLUMN     "time" INTEGER NOT NULL DEFAULT 0;
