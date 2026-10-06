-- AlterTable
ALTER TABLE "users" ADD COLUMN     "district" TEXT;

-- CreateIndex
CREATE INDEX "users_bloodGroup_district_idx" ON "users"("bloodGroup", "district");
