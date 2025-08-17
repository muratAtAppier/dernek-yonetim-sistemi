import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const UpdateMemberGroups = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
  groupId: z.string().min(1),
  action: z.enum(['assign', 'unassign']),
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
    const data = UpdateMemberGroups.parse(json)

    const group = await (prisma as any).group.findFirst({
      where: { id: data.groupId, organizationId: access.org.id },
    })
    if (!group)
      return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 })

    if (data.action === 'assign') {
      await (prisma as any).$transaction(
        data.memberIds.map((memberId: string) =>
          (prisma as any).memberGroup.upsert({
            where: { memberId_groupId: { memberId, groupId: data.groupId } },
            update: {},
            create: { memberId, groupId: data.groupId },
          })
        )
      )
    } else {
      await (prisma as any).memberGroup.deleteMany({
        where: { groupId: data.groupId, memberId: { in: data.memberIds } },
      })
    }

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
