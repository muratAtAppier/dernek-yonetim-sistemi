-- Template for adding a new SUPERADMIN user
-- Execute this in your PostgreSQL database
-- Replace YOUR_EMAIL, YOUR_PASSWORD_HASH, YOUR_FIRST_NAME, YOUR_LAST_NAME with actual values

-- Step 1: Insert the user
-- Generate password hash: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash))"
INSERT INTO "User" (id, email, "passwordHash", name, "firstName", "lastName", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'YOUR_EMAIL',
  'YOUR_PASSWORD_HASH',
  'YOUR_FULL_NAME',
  'YOUR_FIRST_NAME',
  'YOUR_LAST_NAME',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  name = EXCLUDED.name,
  "updatedAt" = NOW()
RETURNING id;

-- Step 2: Add SUPERADMIN membership to all organizations
INSERT INTO "OrganizationMembership" ("id", "userId", "organizationId", "role", "createdAt")
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM "User" WHERE email = 'YOUR_EMAIL'),
  org.id,
  'SUPERADMIN',
  NOW()
FROM "Organization" org
ON CONFLICT ("userId", "organizationId") DO UPDATE SET
  "role" = 'SUPERADMIN';

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  COUNT(om.id) as org_memberships,
  array_agg(om.role) as roles
FROM "User" u
LEFT JOIN "OrganizationMembership" om ON u.id = om."userId"
WHERE u.email = 'YOUR_EMAIL'
GROUP BY u.id, u.email, u."firstName", u."lastName";
