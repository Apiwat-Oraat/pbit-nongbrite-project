/*
  Warnings:

  - You are about to drop the column `currentStreak` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `joinedDate` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalMaxStars` on the `Profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Profile_currentStreak_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "currentStreak",
DROP COLUMN "joinedDate",
DROP COLUMN "longestStreak",
DROP COLUMN "totalMaxStars";
