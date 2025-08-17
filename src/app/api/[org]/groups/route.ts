import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../lib/prisma'
import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../lib/authz'

const CreateGroup = z.object({
  name: z.string().min(1),
  type: z.enum(['GROUP', 'COMMISSION']).optional(),
  color: z.string().optional(),
  description: z.string().optional(),
})
const UpdateGroup = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  type: z.enum(['GROUP', 'COMMISSION']).optional(),
  color: z.string().optional().nullable(),
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

  const items = await (prisma as any).group.findMany({
    where: { organizationId: access.org.id },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
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
    const json = await req.json()
    const data = CreateGroup.parse(json)
    const created = await (prisma as any).group.create({
      data: {
        organizationId: access.org.id,
        name: data.name,
        type: data.type ?? 'GROUP',
        color: data.color,
        description: data.description,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    if (String(e).includes('Unique constraint'))
      return NextResponse.json(
        { error: 'Aynı isim ve tipte grup mevcut' },
        { status: 409 }
      )
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
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
    const json = await req.json()
    const data = UpdateGroup.parse(json)

    const existing = await (prisma as any).group.findFirst({
      where: { id: data.id, organizationId: access.org.id },
    })
    if (!existing)
      return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })

    const updated = await (prisma as any).group.update({
      where: { id: existing.id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        color: data.color === undefined ? existing.color : data.color,
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

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id') || ''
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
    const existing = await (prisma as any).group.findFirst({
      where: { id, organizationId: access.org.id },
    })
    if (!existing)
      return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })

    await (prisma as any).group.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
