-- CreateTable
CREATE TABLE "public"."Template" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AddForeignKey
ALTER TABLE "public"."Template" ADD CONSTRAINT "Template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraint per org
CREATE UNIQUE INDEX "org_template_slug_unique" ON "public"."Template" ("organizationId", "slug");

-- Trigger to update updatedAt on change (Postgres)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_set_updated_at ON "public"."Template";
CREATE TRIGGER template_set_updated_at
BEFORE UPDATE ON "public"."Template"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
