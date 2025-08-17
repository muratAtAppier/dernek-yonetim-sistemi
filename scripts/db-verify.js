// Verify DB seed and basic data integrity
// Usage: npm run db:verify

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const [users, orgs, memberships, members, tags, memberTags] = await prisma.$transaction([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.organizationMembership.count(),
      prisma.member.count(),
      prisma.tag.count(),
      prisma.memberTag.count(),
    ])

    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
    const org = await prisma.organization.findUnique({ where: { slug: 'ornek-dernek' } })
    let role = null
    if (admin && org) {
      const mem = await prisma.organizationMembership.findUnique({
        where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
      })
      role = mem?.role ?? null
    }

    // Check Group/MemberGroup existence and counts via raw SQL to avoid client type coupling
    let groups = null
    let memberGroups = null
    try {
      const g = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "Group"`
      const mg = await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM "MemberGroup"`
      groups = Array.isArray(g) && g[0]?.c !== undefined ? g[0].c : null
      memberGroups = Array.isArray(mg) && mg[0]?.c !== undefined ? mg[0].c : null
    } catch (_) {
      // tables may not exist yet
      groups = null
      memberGroups = null
    }

    const result = {
      counts: { users, organizations: orgs, memberships, members, tags, memberTags, groups, memberGroups },
      adminExists: Boolean(admin),
      organizationExists: Boolean(org),
      adminRoleInOrganization: role,
      migrations: {
        add_tags_applied: typeof tags === 'number' && typeof memberTags === 'number',
        add_groups_applied: groups !== null && memberGroups !== null,
      },
    }

    console.log(JSON.stringify(result, null, 2))
  } catch (e) {
    console.error('DB verify error:', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
