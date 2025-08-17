/*
  Warnings:

  - You are about to drop the column `createdAt` on the `MemberTag` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MemberTag" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "public"."Tag" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
