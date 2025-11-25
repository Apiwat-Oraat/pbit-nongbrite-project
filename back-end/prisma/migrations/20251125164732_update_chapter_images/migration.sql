/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Chapter` table. All the data in the column will be lost.
  - Added the required column `images` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "imageUrl",
ADD COLUMN     "images" JSONB NOT NULL;
