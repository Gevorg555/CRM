-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SETTING', 'CLOSING', 'ABGESCHLOSSEN', 'VERLOREN');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'MESSE', 'KALTAKQUISE', 'EMPFEHLUNG', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "CoreBusiness" AS ENUM ('WEG_VERWALTUNG', 'MIETVERWALTUNG', 'SE_VERWALTUNG', 'MAKLER', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('A18_29', 'A30_39', 'A40_49', 'A50_59', 'A60_PLUS');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('KONTAKTIERT', 'EMAIL', 'MEETING', 'NOTIZ', 'STATUS');

-- CreateEnum
CREATE TYPE "ContactOutcome" AS ENUM ('NICHT_ERREICHT', 'VORZIMMER', 'ENTSCHEIDER_NICHT_VOR_ORT', 'RUECKRUF', 'KEIN_INTERESSE', 'TERMIN_SETTING', 'TERMIN_CLOSING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "company" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "street" TEXT,
    "zip" TEXT,
    "city" TEXT,
    "source" "LeadSource",
    "referredBy" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'SETTING',
    "coreBusiness" "CoreBusiness"[],
    "employeeCount" INTEGER,
    "propertyCount" INTEGER,
    "unitCount" INTEGER,
    "ageRange" "AgeRange",
    "ownerId" TEXT,
    "emailNormalized" TEXT,
    "phoneNormalized" TEXT,
    "companyNormalized" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL,
    "outcome" "ContactOutcome",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "leadId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_emailNormalized_idx" ON "Lead"("emailNormalized");

-- CreateIndex
CREATE INDEX "Lead_phoneNormalized_idx" ON "Lead"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Lead_companyNormalized_idx" ON "Lead"("companyNormalized");

-- CreateIndex
CREATE INDEX "Lead_updatedAt_idx" ON "Lead"("updatedAt");

-- CreateIndex
CREATE INDEX "Activity_leadId_createdAt_idx" ON "Activity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_done_dueDate_idx" ON "Task"("done", "dueDate");

-- CreateIndex
CREATE INDEX "Task_assigneeId_done_idx" ON "Task"("assigneeId", "done");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
