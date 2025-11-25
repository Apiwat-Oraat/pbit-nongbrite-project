/*
  Warnings:

  - You are about to drop the column `bestTiem` on the `LevelCompletion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LevelCompletion" DROP COLUMN "bestTiem",
ADD COLUMN     "bestTime" INTEGER NOT NULL DEFAULT 999999;
