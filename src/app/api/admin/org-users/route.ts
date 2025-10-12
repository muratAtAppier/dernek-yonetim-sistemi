import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/admin/org-users  (SUPERADMIN only)
// Body: { organizationId | organizationSlug, email, password, role }
// Creates (or updates password + role) for a user and attaches membership to target org.

const BodySchema = z
  .object({
    organizationId: z.string().optional(),
    organizationSlug: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'SUPERADMIN']).default('ADMIN'),
  })
  .refine((d) => d.organizationId || d.organizationSlug, {
    message: 'organizationId veya organizationSlug zorunlu',
    path: ['organizationId'],
  })

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if requesting user is SUPERADMIN in any organization
  const superMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id as string, role: 'SUPERADMIN' },
  })
  if (!superMembership)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = BodySchema.parse(json)

    // Resolve organization
    let org = null as any
    if (data.organizationId) {
      org = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      })
    } else if (data.organizationSlug) {
      org = await prisma.organization.findUnique({
        where: { slug: data.organizationSlug },
      })
    }
    if (!org)
      return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })

    // Upsert user
    const hash = await bcrypt.hash(data.password, 10)
    let user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.email.split('@')[0],
          passwordHash: hash,
        },
      })
    } else if (!user.passwordHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      })
    } else {
      // Always update password when explicitly provided
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      })
    }

    // Role normalization: only SUPERADMIN can assign SUPERADMIN; guard anyway
    const targetRole = data.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN'

    // Upsert membership
    const membership = await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: org.id },
      },
      update: { role: targetRole },
      create: { userId: user.id, organizationId: org.id, role: targetRole },
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      membership: {
        id: membership.id,
        role: membership.role,
        organizationId: membership.organizationId,
      },
    })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    console.error('AdminOrgUserCreateError', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
