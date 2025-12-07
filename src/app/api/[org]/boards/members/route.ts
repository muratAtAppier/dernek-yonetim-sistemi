import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'
import { validateBoardMembers } from '../../../../../lib/boardValidation'
import {
  syncBoardToMemberTitle,
  syncBoardMemberRemoval,
  validateBoardRoleAssignment,
} from '../../../../../lib/boardSync'

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
        memberType: z.enum(['ASIL', 'YEDEK']).optional(),
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
      // Get existing members before replacement
      const existingMembers = await tx.boardMember.findMany({
        where: { termId: data.termId },
        select: { memberId: true },
      })

      if (data.replace) {
        // Remove all existing members and sync their titles
        for (const existing of existingMembers) {
          await syncBoardMemberRemoval(
            tx,
            existing.memberId,
            data.termId,
            access.org.id
          )
        }
        await tx.boardMember.deleteMany({ where: { termId: data.termId } })
      } else {
        // For non-replace mode, sync removal for members not in the new list
        const newMemberIds = new Set(data.items.map((it) => it.memberId))
        for (const existing of existingMembers) {
          if (!newMemberIds.has(existing.memberId)) {
            await syncBoardMemberRemoval(
              tx,
              existing.memberId,
              data.termId,
              access.org.id
            )
          }
        }
      }

      // Upsert new members and sync their titles
      for (const [idx, it] of data.items.entries()) {
        const role = it.role ?? 'MEMBER'
        const memberType = it.memberType ?? 'ASIL'

        await tx.boardMember.upsert({
          where: {
            memberId_termId: { memberId: it.memberId, termId: data.termId },
          },
          update: {
            role,
            memberType,
            order: it.order ?? idx + 1,
          },
          create: {
            memberId: it.memberId,
            termId: data.termId,
            role,
            memberType,
            order: it.order ?? idx + 1,
          },
        })

        // Sync board membership to member title
        await syncBoardToMemberTitle(
          tx,
          it.memberId,
          data.termId,
          role,
          memberType,
          access.org.id
        )
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
    const termId = url.searchParams.get('termId') || ''
    const memberId = url.searchParams.get('memberId') || ''

    if (!termId || !memberId)
      return NextResponse.json(
        { error: 'termId ve memberId gerekli' },
        { status: 400 }
      )

    const term = await (prisma as any).boardTerm.findUnique({
      where: { id: termId },
      include: { board: true },
    })
    if (!term || term.board.organizationId !== access.org.id)
      return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

    await (prisma as any).$transaction(async (tx: any) => {
      // Sync removal before deleting
      await syncBoardMemberRemoval(tx, memberId, termId, access.org.id)

      // Delete the board member
      await tx.boardMember.delete({
        where: {
          memberId_termId: { memberId, termId },
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
