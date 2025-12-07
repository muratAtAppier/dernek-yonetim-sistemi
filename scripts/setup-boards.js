/**
 * Setup Script: Create Active Board Terms
 *
 * This script ensures boards have active terms so members can be assigned.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupBoards() {
  console.log('🔧 Setting up boards with active terms...')
  console.log('')

  try {
    // Get all organizations
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
    })

    for (const org of orgs) {
      console.log(`📋 Organization: ${org.name} (${org.slug})`)

      // Check EXECUTIVE board
      let execBoard = await prisma.board.findUnique({
        where: {
          org_board_type_unique: {
            organizationId: org.id,
            type: 'EXECUTIVE',
          },
        },
        include: {
          terms: {
            where: { isActive: true },
          },
        },
      })

      if (!execBoard) {
        console.log('  ➕ Creating Yönetim Kurulu...')
        execBoard = await prisma.board.create({
          data: {
            organizationId: org.id,
            type: 'EXECUTIVE',
            name: 'Yönetim Kurulu',
            description: 'Derneğin yönetim kurulu',
          },
        })
      }

      if (execBoard.terms && execBoard.terms.length === 0) {
        console.log('  ➕ Creating active term for Yönetim Kurulu...')
        await prisma.boardTerm.create({
          data: {
            boardId: execBoard.id,
            name: 'Mevcut Dönem',
            startDate: new Date(),
            isActive: true,
          },
        })
      } else {
        console.log('  ✅ Yönetim Kurulu has active term')
      }

      // Check AUDIT board
      let auditBoard = await prisma.board.findUnique({
        where: {
          org_board_type_unique: {
            organizationId: org.id,
            type: 'AUDIT',
          },
        },
        include: {
          terms: {
            where: { isActive: true },
          },
        },
      })

      if (!auditBoard) {
        console.log('  ➕ Creating Denetim Kurulu...')
        auditBoard = await prisma.board.create({
          data: {
            organizationId: org.id,
            type: 'AUDIT',
            name: 'Denetim Kurulu',
            description: 'Derneğin denetim kurulu',
          },
        })
      }

      if (auditBoard.terms && auditBoard.terms.length === 0) {
        console.log('  ➕ Creating active term for Denetim Kurulu...')
        await prisma.boardTerm.create({
          data: {
            boardId: auditBoard.id,
            name: 'Mevcut Dönem',
            startDate: new Date(),
            isActive: true,
          },
        })
      } else {
        console.log('  ✅ Denetim Kurulu has active term')
      }

      console.log('')
    }

    console.log('✅ Setup completed!')
  } catch (error) {
    console.error('❌ Error during setup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupBoards().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
