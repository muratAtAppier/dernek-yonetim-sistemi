-- Boards & Organization Chart

-- Enums
DO $$ BEGIN
	CREATE TYPE "public"."BoardType" AS ENUM ('EXECUTIVE','AUDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	CREATE TYPE "public"."BoardMemberRole" AS ENUM ('PRESIDENT','VICE_PRESIDENT','SECRETARY','TREASURER','MEMBER','SUPERVISOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."Board" (
	"id" TEXT NOT NULL,
	"organizationId" TEXT NOT NULL,
	"type" "public"."BoardType" NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_board_type_unique" ON "public"."Board" ("organizationId","type");

ALTER TABLE "public"."Board"
	ADD CONSTRAINT "Board_organizationId_fkey"
	FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."BoardTerm" (
	"id" TEXT NOT NULL,
	"boardId" TEXT NOT NULL,
	"name" TEXT,
	"startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"endDate" TIMESTAMP(3),
	"isActive" BOOLEAN NOT NULL DEFAULT FALSE,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "BoardTerm_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."BoardTerm"
	ADD CONSTRAINT "BoardTerm_boardId_fkey"
	FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."BoardMember" (
	"memberId" TEXT NOT NULL,
	"termId" TEXT NOT NULL,
	"role" "public"."BoardMemberRole" NOT NULL DEFAULT 'MEMBER',
	"order" INTEGER,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("memberId","termId")
);

ALTER TABLE "public"."BoardMember"
	ADD CONSTRAINT "BoardMember_memberId_fkey"
	FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BoardMember"
	ADD CONSTRAINT "BoardMember_termId_fkey"
	FOREIGN KEY ("termId") REFERENCES "public"."BoardTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."BoardDecision" (
	"id" TEXT NOT NULL,
	"boardId" TEXT NOT NULL,
	"termId" TEXT,
	"title" TEXT NOT NULL,
	"decisionNo" TEXT,
	"decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"content" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "BoardDecision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."BoardDecision"
	ADD CONSTRAINT "BoardDecision_boardId_fkey"
	FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BoardDecision"
	ADD CONSTRAINT "BoardDecision_termId_fkey"
	FOREIGN KEY ("termId") REFERENCES "public"."BoardTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
