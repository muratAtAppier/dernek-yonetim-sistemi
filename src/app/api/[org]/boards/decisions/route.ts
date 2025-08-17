import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const UpsertDecision = z.object({
  id: z.string().optional(),
  boardId: z.string().min(1),
  termId: z.string().optional().nullable(),
  title: z.string().min(2),
  decisionNo: z.string().optional().nullable(),
  decisionDate: z.string().datetime().optional(),
  content: z.string().min(1),
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

  const items = await (prisma as any).boardDecision.findMany({
    where: { boardId },
    orderBy: [{ decisionDate: 'desc' }, { createdAt: 'desc' }],
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
    const data = UpsertDecision.parse(body)

    const board = await (prisma as any).board.findFirst({
      where: { id: data.boardId, organizationId: access.org.id },
    })
    if (!board)
      return NextResponse.json({ error: 'Kurul bulunamadı' }, { status: 404 })

    const created = await (prisma as any).boardDecision.create({
      data: {
        boardId: data.boardId,
        termId: data.termId || null,
        title: data.title,
        decisionNo: data.decisionNo || null,
        decisionDate: data.decisionDate
          ? new Date(data.decisionDate)
          : new Date(),
        content: data.content,
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
    const data = UpsertDecision.parse(body)
    if (!data.id)
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

    const existing = await (prisma as any).boardDecision.findUnique({
      where: { id: data.id },
      include: { board: true },
    })
    if (!existing || existing.board.organizationId !== access.org.id)
      return NextResponse.json({ error: 'Karar bulunamadı' }, { status: 404 })

    const updated = await (prisma as any).boardDecision.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        decisionNo: data.decisionNo || null,
        decisionDate: data.decisionDate
          ? new Date(data.decisionDate)
          : existing.decisionDate,
        content: data.content,
        termId: data.termId || null,
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

  const existing = await (prisma as any).boardDecision.findUnique({
    where: { id },
    include: { board: true },
  })
  if (!existing || existing.board.organizationId !== access.org.id)
    return NextResponse.json({ error: 'Karar bulunamadı' }, { status: 404 })

  await (prisma as any).boardDecision.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
