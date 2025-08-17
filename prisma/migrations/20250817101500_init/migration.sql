-- This migration previously assumed the Template table existed already.
-- It now guards the statements to work in fresh shadow databases.

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Template'
	) THEN
		ALTER TABLE "public"."Template"
			ALTER COLUMN "createdAt" TYPE TIMESTAMP(3),
			ALTER COLUMN "updatedAt" DROP DEFAULT,
			ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3);
	END IF;
END
$$;

-- Rename the unique index if it exists (older name created by earlier manual SQL)
ALTER INDEX IF EXISTS "public"."org_template_slug_unique" RENAME TO "Template_organizationId_slug_key";
