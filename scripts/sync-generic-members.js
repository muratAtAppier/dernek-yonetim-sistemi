const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Find all members with YEDEK titles who aren't in boards yet
  const members = await prisma.member.findMany({
    where: {
      OR: [
        { title: 'YONETIM_KURULU_YEDEK' },
        { title: 'DENETIM_KURULU_YEDEK' },
        { title: 'YONETIM_KURULU_ASIL' },
        { title: 'DENETIM_KURULU_ASIL' },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      organizationId: true,
    },
  })

  console.log(`Found ${members.length} members with board titles`)

  for (const member of members) {
    console.log(
      `\nProcessing: ${member.firstName} ${member.lastName} (${member.title})`
    )

    // Determine board type
    const boardType = member.title.startsWith('YONETIM') ? 'EXECUTIVE' : 'AUDIT'
    const memberType = member.title.includes('YEDEK') ? 'YEDEK' : 'ASIL'

    // Find the board
    const board = await prisma.board.findUnique({
      where: {
        organizationId_type: {
          organizationId: member.organizationId,
          type: boardType,
        },
      },
      include: {
        terms: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!board) {
      console.log(`  ❌ No ${boardType} board found`)
      continue
    }

    const activeTerm = board.terms[0]
    if (!activeTerm) {
      console.log(`  ❌ No active term found for ${boardType} board`)
      continue
    }

    // Check if already exists
    const existing = await prisma.boardMember.findUnique({
      where: {
        termId_memberId: {
          termId: activeTerm.id,
          memberId: member.id,
        },
      },
    })

    if (existing) {
      console.log(`  ℹ️ Already in board`)
      continue
    }

    // Get the next order number
    const maxOrder = await prisma.boardMember.aggregate({
      where: { termId: activeTerm.id },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order || 0) + 1

    // Create board member
    await prisma.boardMember.create({
      data: {
        termId: activeTerm.id,
        memberId: member.id,
        role: 'MEMBER',
        memberType: memberType,
        order: nextOrder,
      },
    })

    console.log(`  ✅ Added to ${boardType} board as ${memberType} member`)
  }

  console.log('\n✅ Sync complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
