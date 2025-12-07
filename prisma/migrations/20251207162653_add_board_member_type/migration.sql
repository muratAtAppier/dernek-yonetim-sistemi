-- CreateEnum
CREATE TYPE "public"."BoardMemberType" AS ENUM ('ASIL', 'YEDEK');

-- AlterTable
ALTER TABLE "public"."BoardMember" ADD COLUMN     "memberType" "public"."BoardMemberType" NOT NULL DEFAULT 'ASIL';
