/*
  Warnings:

  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastDonationDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "totalDonations" TEXT,
ALTER COLUMN "password" SET NOT NULL;
