/*
  Warnings:

  - The values [USER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `district` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastDonationDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `totalDonations` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RECIPIENT', 'DONOR');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'RECIPIENT';
COMMIT;

-- DropIndex
DROP INDEX "users_bloodGroup_district_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "district",
DROP COLUMN "isAvailable",
DROP COLUMN "lastDonationDate",
DROP COLUMN "totalDonations",
ALTER COLUMN "role" SET DEFAULT 'RECIPIENT';

-- CreateTable
CREATE TABLE "donors" (
    "id" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastDonationDate" TIMESTAMP(3),
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "weight" TEXT,
    "healthNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donors_userId_key" ON "donors"("userId");

-- CreateIndex
CREATE INDEX "donors_isAvailable_lastDonationDate_idx" ON "donors"("isAvailable", "lastDonationDate");

-- CreateIndex
CREATE INDEX "users_bloodGroup_address_idx" ON "users"("bloodGroup", "address");

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
