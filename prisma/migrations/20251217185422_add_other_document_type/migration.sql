-- AlterEnum
ALTER TYPE "public"."MeetingDocumentType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "public"."MeetingDocument" ADD COLUMN     "customName" TEXT;
