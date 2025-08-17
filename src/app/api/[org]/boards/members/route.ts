import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const UpdateBoardMembers = z.object({
  termId: z.string().min(1),
  items: z
    .array(
      z.object({
        memberId: z.string().min(1),
        role: z
          .enum([
            'PRESIDENT',
            'VICE_PRESIDENT',
            'SECRETARY',
            'TREASURER',
            'MEMBER',
            'SUPERVISOR',
          ])
          .optional(),
        order: z.number().int().optional(),
      })
    )
    .min(1),
  replace: z.boolean().optional(),
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
  const termId = url.searchParams.get('termId') || ''
  if (!termId)
    return NextResponse.json({ error: 'termId gerekli' }, { status: 400 })

  const term = await (prisma as any).boardTerm.findUnique({
    where: { id: termId },
    include: { board: true },
  })
  if (!term || term.board.organizationId !== access.org.id)
    return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

  const items = await (prisma as any).boardMember.findMany({
    where: { termId },
    orderBy: [{ order: 'asc' }],
    include: { member: true },
  })
  return NextResponse.json({ items })
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
    const data = UpdateBoardMembers.parse(body)

    const term = await (prisma as any).boardTerm.findUnique({
      where: { id: data.termId },
      include: { board: true },
    })
    if (!term || term.board.organizationId !== access.org.id)
      return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

    await (prisma as any).$transaction(async (tx: any) => {
      if (data.replace) {
        await tx.boardMember.deleteMany({ where: { termId: data.termId } })
      }
      for (const [idx, it] of data.items.entries()) {
        await tx.boardMember.upsert({
          where: {
            memberId_termId: { memberId: it.memberId, termId: data.termId },
          },
          update: { role: it.role ?? 'MEMBER', order: it.order ?? idx + 1 },
          create: {
            memberId: it.memberId,
            termId: data.termId,
            role: it.role ?? 'MEMBER',
            order: it.order ?? idx + 1,
          },
        })
      }
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
