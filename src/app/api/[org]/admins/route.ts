import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug } from '@/lib/authz'

// Schema for creating a new admin
const CreateAdminSchema = z.object({
  firstName: z.string().min(2, 'En az 2 karakter'),
  lastName: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Geçerli e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

// Schema for updating admin password
const UpdatePasswordSchema = z.object({
  userId: z.string(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

// Schema for deleting admin
const DeleteAdminSchema = z.object({
  userId: z.string(),
})

// GET /api/[org]/admins - List admins for the org (excluding SUPERADMIN)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(session.user.id, org)
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      organization: { slug: org },
      role: 'ADMIN', // Only ADMIN, not SUPERADMIN
    },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const admins = memberships.map((m) => ({
    id: m.user.id,
    membershipId: m.id,
    firstName: m.user.firstName || '',
    lastName: m.user.lastName || '',
    email: m.user.email || '',
    role: m.role,
  }))

  return NextResponse.json({ admins })
}

// POST /api/[org]/admins - Create new admin
export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(session.user.id, org)
  if (
    !access.allowed ||
    (access.role !== 'ADMIN' && access.role !== 'SUPERADMIN')
  )
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = CreateAdminSchema.parse(json)

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: org },
    })
    if (!organization)
      return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })

    // Check if user with this email already exists
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    const passwordHash = await bcrypt.hash(data.password, 10)

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
          passwordHash: passwordHash,
        },
      })
    } else {
      // Check if user already has membership in this org
      const existingMembership = await prisma.organizationMembership.findUnique(
        {
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organization.id,
            },
          },
        }
      )

      if (existingMembership) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten bu dernekte kayıtlı' },
          { status: 400 }
        )
      }

      // Update existing user's info
      user = await prisma.user.update({
        where: { email: data.email },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
          passwordHash: passwordHash,
        },
      })
    }

    // Create admin membership
    const membership = await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      admin: {
        id: user.id,
        membershipId: membership.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: 'ADMIN',
      },
    })
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

// PATCH /api/[org]/admins - Update admin password
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(session.user.id, org)
  if (
    !access.allowed ||
    (access.role !== 'ADMIN' && access.role !== 'SUPERADMIN')
  )
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = UpdatePasswordSchema.parse(json)

    // Verify user has membership in this org
    const organization = await prisma.organization.findUnique({
      where: { slug: org },
    })
    if (!organization)
      return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })

    const membership = await prisma.organizationMembership.findFirst({
      where: {
        userId: data.userId,
        organizationId: organization.id,
        role: 'ADMIN', // Only allow updating ADMIN passwords, not SUPERADMIN
      },
    })

    if (!membership)
      return NextResponse.json(
        { error: 'Bu kullanıcı bu dernekte yönetici değil' },
        { status: 404 }
      )

    // Update password
    const passwordHash = await bcrypt.hash(data.password, 10)
    await prisma.user.update({
      where: { id: data.userId },
      data: { passwordHash },
    })

    return NextResponse.json({ ok: true })
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

// DELETE /api/[org]/admins - Remove admin from org
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(session.user.id, org)
  if (
    !access.allowed ||
    (access.role !== 'ADMIN' && access.role !== 'SUPERADMIN')
  )
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = DeleteAdminSchema.parse(json)

    // Don't allow deleting yourself
    if (data.userId === session.user.id)
      return NextResponse.json(
        { error: 'Kendinizi silemezsiniz' },
        { status: 400 }
      )

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: org },
    })
    if (!organization)
      return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })

    // Find and delete the membership (only ADMIN, not SUPERADMIN)
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        userId: data.userId,
        organizationId: organization.id,
        role: 'ADMIN',
      },
    })

    if (!membership)
      return NextResponse.json(
        { error: 'Bu kullanıcı bu dernekte yönetici değil' },
        { status: 404 }
      )

    await prisma.organizationMembership.delete({
      where: { id: membership.id },
    })

    return NextResponse.json({ ok: true })
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
