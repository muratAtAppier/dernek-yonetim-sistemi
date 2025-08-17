// @ts-nocheck
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../lib/prisma'
import { getSession } from '../../../../lib/auth'

const AssignAdmin = z.object({
  orgSlug: z.string().min(3),
  email: z.string().email(),
})

// Only SUPERADMIN can assign admins across orgs
export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check requester is SUPERADMIN somewhere
  const isSuper = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id, role: 'SUPERADMIN' },
  })
  if (!isSuper)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = AssignAdmin.parse(await req.json())
    const org = await prisma.organization.findUnique({
      where: { slug: body.orgSlug },
    })
    if (!org)
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    let user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) {
      user = await prisma.user.create({ data: { email: body.email } })
    }

    const membership = await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: org.id },
      },
      update: { role: 'ADMIN' },
      create: { userId: user.id, organizationId: org.id, role: 'ADMIN' },
      select: { id: true, role: true },
    })

    return NextResponse.json({ ok: true, membership })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
