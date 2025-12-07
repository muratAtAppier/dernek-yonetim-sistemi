/**
 * Data Migration Script: Sync Member Titles to Boards
 *
 * This script finds members with board titles and adds them to the appropriate boards.
 * Run this to sync existing member titles to board memberships.
 *
 * Usage:
 *   node scripts/sync-titles-to-boards.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Import mapping functions from boardSync
function memberTitleToBoardRole(title) {
  switch (title) {
    case 'BASKAN':
      return 'PRESIDENT'
    case 'BASKAN_YARDIMCISI':
      return 'VICE_PRESIDENT'
    case 'SEKRETER':
      return 'SECRETARY'
    case 'SAYMAN':
      return 'TREASURER'
    case 'DENETIM_KURULU_BASKANI':
      return 'SUPERVISOR'
    default:
      return 'MEMBER'
  }
}

function memberTitleToMemberType(title) {
  switch (title) {
    case 'YONETIM_KURULU_YEDEK':
    case 'DENETIM_KURULU_YEDEK':
      return 'YEDEK'
    default:
      return 'ASIL'
  }
}

function getBoardTypeForTitle(title) {
  switch (title) {
    case 'BASKAN':
    case 'BASKAN_YARDIMCISI':
    case 'SEKRETER':
    case 'SAYMAN':
    case 'YONETIM_KURULU_ASIL':
    case 'YONETIM_KURULU_YEDEK':
      return 'EXECUTIVE'
    case 'DENETIM_KURULU_BASKANI':
    case 'DENETIM_KURULU_ASIL':
    case 'DENETIM_KURULU_YEDEK':
      return 'AUDIT'
    default:
      return null
  }
}

async function syncTitlesToBoards(dryRun = false) {
  console.log('🔄 Syncing member titles to board memberships...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  try {
    // Get all members with board titles
    const members = await prisma.member.findMany({
      where: {
        title: {
          not: null,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        organizationId: true,
        boardMemberships: {
          select: {
            termId: true,
            role: true,
            memberType: true,
          },
        },
      },
    })

    console.log(`Found ${members.length} members with titles`)
    console.log('')

    const updates = []
    const skipped = []
    const errors = []

    for (const member of members) {
      const boardType = getBoardTypeForTitle(member.title)

      if (!boardType) {
        console.log(
          `⏭️  Skipping ${member.firstName} ${member.lastName} - title "${member.title}" is not a board title`
        )
        skipped.push({ member, reason: 'Not a board title' })
        continue
      }

      // Find the board and its active term
      const board = await prisma.board.findUnique({
        where: {
          org_board_type_unique: {
            organizationId: member.organizationId,
            type: boardType,
          },
        },
        include: {
          terms: {
            where: { isActive: true },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      })

      if (!board || board.terms.length === 0) {
        console.log(
          `⚠️  No active term found for ${member.firstName} ${member.lastName} - ${boardType} board`
        )
        skipped.push({
          member,
          reason: `No active ${boardType} board term`,
        })
        continue
      }

      const activeTerm = board.terms[0]
      const role = memberTitleToBoardRole(member.title)
      const memberType = memberTitleToMemberType(member.title)

      // Check if already in board
      const existingMembership = member.boardMemberships.find(
        (bm) => bm.termId === activeTerm.id
      )

      if (existingMembership) {
        if (
          existingMembership.role === role &&
          existingMembership.memberType === memberType
        ) {
          console.log(
            `✅ ${member.firstName} ${member.lastName}: Already synced (${role}/${memberType})`
          )
          continue
        } else {
          console.log(
            `📝 ${member.firstName} ${member.lastName}: Update needed - ${existingMembership.role}/${existingMembership.memberType} → ${role}/${memberType}`
          )
          updates.push({
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            termId: activeTerm.id,
            action: 'update',
            role,
            memberType,
          })

          if (!dryRun) {
            await prisma.boardMember.update({
              where: {
                memberId_termId: {
                  memberId: member.id,
                  termId: activeTerm.id,
                },
              },
              data: {
                role,
                memberType,
              },
            })
          }
        }
      } else {
        console.log(
          `➕ ${member.firstName} ${member.lastName}: Adding to board as ${role}/${memberType}`
        )
        updates.push({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          termId: activeTerm.id,
          action: 'create',
          role,
          memberType,
        })

        if (!dryRun) {
          await prisma.boardMember.create({
            data: {
              memberId: member.id,
              termId: activeTerm.id,
              role,
              memberType,
            },
          })
        }
      }
    }

    console.log('')
    console.log('📊 Summary:')
    console.log(`   Total members with titles: ${members.length}`)
    console.log(`   Updates/additions needed: ${updates.length}`)
    console.log(`   Skipped: ${skipped.length}`)

    if (skipped.length > 0) {
      console.log('')
      console.log('⏭️  Skipped members:')
      skipped.forEach((s) => {
        console.log(
          `   - ${s.member.firstName} ${s.member.lastName}: ${s.reason}`
        )
      })
    }

    if (dryRun && updates.length > 0) {
      console.log('')
      console.log(
        '💡 This was a dry run. Run without --dry-run to apply changes.'
      )
    }

    if (!dryRun && updates.length > 0) {
      console.log('')
      console.log('✅ Sync completed successfully!')
    }
  } catch (error) {
    console.error('❌ Error during sync:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Run the sync
syncTitlesToBoards(dryRun).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
