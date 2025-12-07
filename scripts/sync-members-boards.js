/**
 * Data Migration Script: Sync Members and Boards
 *
 * This script synchronizes existing member titles with board memberships.
 * Run this after deploying the new synchronization features.
 *
 * Usage:
 *   node scripts/sync-members-boards.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Role mapping helpers
function boardRoleToMemberTitle(role, memberType, boardType) {
  if (memberType === 'YEDEK') {
    return boardType === 'EXECUTIVE'
      ? 'YONETIM_KURULU_YEDEK'
      : 'DENETIM_KURULU_YEDEK'
  }

  if (boardType === 'EXECUTIVE') {
    switch (role) {
      case 'PRESIDENT':
        return 'BASKAN'
      case 'VICE_PRESIDENT':
        return 'BASKAN_YARDIMCISI'
      case 'SECRETARY':
        return 'SEKRETER'
      case 'TREASURER':
        return 'SAYMAN'
      case 'MEMBER':
        return 'YONETIM_KURULU_ASIL'
      default:
        return 'YONETIM_KURULU_ASIL'
    }
  } else {
    switch (role) {
      case 'SUPERVISOR':
        return 'DENETIM_KURULU_BASKANI'
      case 'MEMBER':
        return 'DENETIM_KURULU_ASIL'
      default:
        return 'DENETIM_KURULU_ASIL'
    }
  }
}

async function syncBoardsToMembers(dryRun = false) {
  console.log('🔄 Syncing board memberships to member titles...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  try {
    // Get all active board memberships
    const boardMembers = await prisma.boardMember.findMany({
      include: {
        term: {
          where: { isActive: true },
          include: { board: true },
        },
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    })

    const updates = []
    const conflicts = []

    for (const bm of boardMembers) {
      if (!bm.term || !bm.term.isActive) {
        console.log(
          `⏭️  Skipping ${bm.member.firstName} ${bm.member.lastName} - not in active term`
        )
        continue
      }

      const expectedTitle = boardRoleToMemberTitle(
        bm.role,
        bm.memberType,
        bm.term.board.type
      )
      const currentTitle = bm.member.title

      if (currentTitle !== expectedTitle) {
        // Check if the expected title is already taken by someone else
        if (
          expectedTitle !== 'UYE' &&
          expectedTitle !== 'YONETIM_KURULU_ASIL' &&
          expectedTitle !== 'YONETIM_KURULU_YEDEK' &&
          expectedTitle !== 'DENETIM_KURULU_ASIL' &&
          expectedTitle !== 'DENETIM_KURULU_YEDEK'
        ) {
          const conflictingMember = await prisma.member.findFirst({
            where: {
              organizationId: bm.member.organizationId,
              title: expectedTitle,
              id: { not: bm.member.id },
            },
            select: { id: true, firstName: true, lastName: true, title: true },
          })

          if (conflictingMember) {
            conflicts.push({
              member: bm.member,
              expectedTitle,
              conflictingMember,
            })
            console.log(
              `⚠️  CONFLICT: Cannot set ${bm.member.firstName} ${bm.member.lastName} to ${expectedTitle}`
            )
            console.log(
              `   Already held by: ${conflictingMember.firstName} ${conflictingMember.lastName}`
            )
            continue
          }
        }

        updates.push({
          memberId: bm.member.id,
          memberName: `${bm.member.firstName} ${bm.member.lastName}`,
          currentTitle,
          expectedTitle,
        })

        console.log(
          `📝 ${bm.member.firstName} ${bm.member.lastName}: ${currentTitle || 'null'} → ${expectedTitle}`
        )

        if (!dryRun) {
          await prisma.member.update({
            where: { id: bm.member.id },
            data: { title: expectedTitle },
          })
        }
      } else {
        console.log(
          `✅ ${bm.member.firstName} ${bm.member.lastName}: ${currentTitle} (already synced)`
        )
      }
    }

    console.log('')
    console.log('📊 Summary:')
    console.log(`   Total board members checked: ${boardMembers.length}`)
    console.log(`   Updates needed: ${updates.length}`)
    console.log(`   Conflicts detected: ${conflicts.length}`)

    if (conflicts.length > 0) {
      console.log('')
      console.log('⚠️  Conflicts need manual resolution:')
      conflicts.forEach((c) => {
        console.log(
          `   - ${c.member.firstName} ${c.member.lastName} wants ${c.expectedTitle}`
        )
        console.log(
          `     but ${c.conflictingMember.firstName} ${c.conflictingMember.lastName} already has it`
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
syncBoardsToMembers(dryRun).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
