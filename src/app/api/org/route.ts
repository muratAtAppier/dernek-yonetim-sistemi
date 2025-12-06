// @ts-nocheck
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { getSession } from '../../../lib/auth'
import { isSuperAdmin } from '../../../lib/authz'
import { normalizePhoneNumber } from '../../../lib/utils'

const CreateOrg = z.object({
  name: z.string().min(3),
  responsibleFirstName: z.string().min(2),
  responsibleLastName: z.string().min(2),
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

    // Auto-generate slug from name
    const slugify = (str: string) => {
      return str
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    let slug = slugify(data.name)
    let counter = 1

    // Check for slug uniqueness and add counter if needed
    while (true) {
      const exists = await prisma.organization.findUnique({
        where: { slug },
      })
      if (!exists) break
      slug = `${slugify(data.name)}-${counter}`
      counter++
    }

    const created = await prisma.organization.create({
      data: {
        name: data.name,
        slug: slug,
        description: data.description,
        address: data.address,
        phone: normalizePhoneNumber(data.phone),
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

    // Update user's firstName and lastName
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.responsibleFirstName,
        lastName: data.responsibleLastName,
        name: `${data.responsibleFirstName} ${data.responsibleLastName}`,
      },
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
