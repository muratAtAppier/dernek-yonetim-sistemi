// Simple helper to inspect available Prisma model delegates
const { PrismaClient } = require('@prisma/client')

async function main() {
  try {
    const prisma = new PrismaClient()
    const keys = Object.keys(prisma).filter(k => !k.startsWith('$'))
    console.log('PrismaClient delegates:', keys.sort().join(', '))
    await prisma.$disconnect()
  } catch (e) {
    console.error('Failed to instantiate PrismaClient:', e?.message || e)
    process.exitCode = 1
  }
}
main()
