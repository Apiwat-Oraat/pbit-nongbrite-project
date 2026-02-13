-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetExpire" TIMESTAMP(3),
ADD COLUMN     "resetPin" TEXT;
