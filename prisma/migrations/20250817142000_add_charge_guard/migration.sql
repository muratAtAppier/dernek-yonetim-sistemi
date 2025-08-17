-- Prevent duplicate charges (soft) by creating a non-unique index; app enforces no-dup logic
CREATE INDEX IF NOT EXISTS "FinanceTransaction_charge_guard_idx"
ON "FinanceTransaction" ("organizationId", "type", "planId", "periodId", "memberId");

-- Note: For strict prevention you could add a partial unique index e.g.
-- CREATE UNIQUE INDEX CONCURRENTLY ... WHERE type = 'CHARGE'
-- but Prisma migrate with partial indexes may require manual handling across environments.
