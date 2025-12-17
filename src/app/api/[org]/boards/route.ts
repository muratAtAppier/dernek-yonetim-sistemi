import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../lib/prisma'
import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../lib/authz'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CreateBoard = z.object({
  type: z.enum(['EXECUTIVE', 'AUDIT']),
  name: z.string().min(2),
  description: z.string().optional(),
})
const UpdateBoard = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const items = await prisma.board.findMany({
    where: { organizationId: access.org.id },
    orderBy: [{ type: 'asc' }],
    include: {
      terms: {
        where: { isActive: true },
        take: 1,
        include: {
          members: {
            include: { member: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })
  return NextResponse.json({ items })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    org,
    WRITE_ROLES
  )
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = CreateBoard.parse(body)

    console.log('Creating board:', data, 'for org:', access.org.id)

    const created = await prisma.board.create({
      data: {
        organizationId: access.org.id,
        type: data.type,
        name: data.name,
        description: data.description || null,
      },
    })

    console.log('Board created:', created.id)
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (e: any) {
    console.error('Board creation error:', e)
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    if (String(e).includes('org_board_type_unique') || e?.code === 'P2002')
      return NextResponse.json(
        { error: 'Bu tipte kurul zaten var' },
        { status: 409 }
      )
    return NextResponse.json(
      { error: 'Server error', detail: e?.message || String(e) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    org,
    WRITE_ROLES
  )
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = UpdateBoard.parse(body)
    const existing = await prisma.board.findFirst({
      where: { id: data.id, organizationId: access.org.id },
    })
    if (!existing)
      return NextResponse.json({ error: 'Kurul bulunamadı' }, { status: 404 })

    const updated = await prisma.board.update({
      where: { id: existing.id },
      data: {
        name: data.name ?? existing.name,
        description:
          data.description === undefined
            ? existing.description
            : data.description,
      },
    })
    return NextResponse.json({ item: updated })
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    org,
    WRITE_ROLES
  )
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  const existing = await prisma.board.findFirst({
    where: { id, organizationId: access.org.id },
  })
  if (!existing)
    return NextResponse.json({ error: 'Kurul bulunamadı' }, { status: 404 })

  await prisma.board.delete({ where: { id: existing.id } })
  return NextResponse.json({ ok: true })
}
