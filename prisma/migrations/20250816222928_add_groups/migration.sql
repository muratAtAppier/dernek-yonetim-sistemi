-- CreateEnum
CREATE TYPE "public"."GroupType" AS ENUM ('GROUP', 'COMMISSION');

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."GroupType" NOT NULL DEFAULT 'GROUP',
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MemberGroup" (
    "memberId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberGroup_pkey" PRIMARY KEY ("memberId","groupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_organizationId_name_type_key" ON "public"."Group"("organizationId", "name", "type");

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberGroup" ADD CONSTRAINT "MemberGroup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberGroup" ADD CONSTRAINT "MemberGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
