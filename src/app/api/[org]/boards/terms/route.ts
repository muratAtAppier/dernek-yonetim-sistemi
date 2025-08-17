import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const CreateTerm = z.object({
  boardId: z.string().min(1),
  name: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
})
const UpdateTerm = z.object({
  id: z.string().min(1),
  name: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: Request,
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

  const url = new URL(req.url)
  const boardId = url.searchParams.get('boardId') || ''
  if (!boardId)
    return NextResponse.json({ error: 'boardId gerekli' }, { status: 400 })

  const board = await (prisma as any).board.findFirst({
    where: { id: boardId, organizationId: access.org.id },
  })
  if (!board)
    return NextResponse.json({ error: 'Kurul bulunamadı' }, { status: 404 })

  const items = await (prisma as any).boardTerm.findMany({
    where: { boardId },
    orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    include: { members: { include: { member: true } } },
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
    const data = CreateTerm.parse(body)

    const board = await (prisma as any).board.findFirst({
      where: { id: data.boardId, organizationId: access.org.id },
    })
    if (!board)
      return NextResponse.json({ error: 'Kurul bulunamadı' }, { status: 404 })

    if (data.isActive) {
      await (prisma as any).boardTerm.updateMany({
        where: { boardId: data.boardId, isActive: true },
        data: { isActive: false },
      })
    }

    const created = await (prisma as any).boardTerm.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? false,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
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
    const data = UpdateTerm.parse(body)

    const existing = await (prisma as any).boardTerm.findUnique({
      where: { id: data.id },
      include: { board: true },
    })
    if (!existing || existing.board.organizationId !== access.org.id)
      return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

    if (data.isActive) {
      await (prisma as any).boardTerm.updateMany({
        where: { boardId: existing.boardId, isActive: true },
        data: { isActive: false },
      })
    }

    const updated = await (prisma as any).boardTerm.update({
      where: { id: existing.id },
      data: {
        name: data.name === undefined ? existing.name : data.name,
        startDate: data.startDate
          ? new Date(data.startDate)
          : existing.startDate,
        endDate:
          data.endDate === undefined
            ? existing.endDate
            : data.endDate
              ? new Date(data.endDate)
              : null,
        isActive: data.isActive ?? existing.isActive,
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

  const existing = await (prisma as any).boardTerm.findUnique({
    where: { id },
    include: { board: true },
  })
  if (!existing || existing.board.organizationId !== access.org.id)
    return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

  await (prisma as any).boardTerm.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
