-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BloodrequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bloodrequest" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "bloodGroup" "BloodGroupList" NOT NULL,
    "bagsNeeded" INTEGER NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL',
    "needAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "note" TEXT,
    "status" "BloodrequestStatus" NOT NULL DEFAULT 'OPEN',
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloodrequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BloodrequestToDonor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BloodrequestToDonor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "bloodrequest_status_bloodGroup_needAt_idx" ON "bloodrequest"("status", "bloodGroup", "needAt");

-- CreateIndex
CREATE INDEX "_BloodrequestToDonor_B_index" ON "_BloodrequestToDonor"("B");

-- AddForeignKey
ALTER TABLE "bloodrequest" ADD CONSTRAINT "bloodrequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BloodrequestToDonor" ADD CONSTRAINT "_BloodrequestToDonor_A_fkey" FOREIGN KEY ("A") REFERENCES "bloodrequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BloodrequestToDonor" ADD CONSTRAINT "_BloodrequestToDonor_B_fkey" FOREIGN KEY ("B") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
