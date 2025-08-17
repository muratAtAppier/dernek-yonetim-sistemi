// @ts-nocheck
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { getSession } from '../../../lib/auth'
import { isSuperAdmin } from '../../../lib/authz'

const CreateOrg = z.object({
  name: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const superadmin = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id, role: 'SUPERADMIN' },
  })
  const items = await prisma.organization.findMany({
    where: superadmin
      ? {}
      : { memberships: { some: { userId: session.user.id } } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only SUPERADMIN can create organizations in this phase
  const canCreate = await isSuperAdmin(session.user.id)
  if (!canCreate)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = CreateOrg.parse(json)

    // slug benzersizliği
    const exists = await prisma.organization.findUnique({
      where: { slug: data.slug },
    })
    if (exists) {
      return NextResponse.json(
        { error: 'Slug zaten kullanılıyor' },
        { status: 409 }
      )
    }

    const created = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        memberships: {
          create: {
            userId: session.user.id,
            role: 'SUPERADMIN',
          },
        },
      },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
