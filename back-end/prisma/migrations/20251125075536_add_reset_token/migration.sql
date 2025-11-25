/*
  Warnings:

  - The `desc` column on the `Level` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `title` on the `Achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `desc` on the `Achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `title` on the `Chapter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `desc` on the `Chapter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `title` on the `Level` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL,
DROP COLUMN "desc",
ADD COLUMN     "desc" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL,
DROP COLUMN "desc",
ADD COLUMN     "desc" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Level" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL,
DROP COLUMN "desc",
ADD COLUMN     "desc" JSONB;
