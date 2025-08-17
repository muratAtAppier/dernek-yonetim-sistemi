import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const CreateTag = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})
const UpdateMemberTags = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
  tagId: z.string().min(1),
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

  const tags = await (prisma as any).tag.findMany({
    where: { organizationId: access.org.id },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ items: tags })
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
    const data = CreateTag.parse(json)
    const tag = await (prisma as any).tag.create({
      data: {
        organizationId: access.org.id,
        name: data.name,
        color: data.color,
      },
    })
    return NextResponse.json({ item: tag }, { status: 201 })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    if (String(e).includes('Unique constraint'))
      return NextResponse.json(
        { error: 'Aynı isimde etiket var' },
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
    const data = UpdateMemberTags.parse(json)

    const tag = await prisma.tag.findFirst({
      where: { id: data.tagId, organizationId: access.org.id },
    })
    if (!tag)
      return NextResponse.json({ error: 'Etiket bulunamadı' }, { status: 404 })

    if (data.action === 'assign') {
      await prisma.$transaction(
        data.memberIds.map((memberId) =>
          prisma.memberTag.upsert({
            where: { memberId_tagId: { memberId, tagId: data.tagId } },
            update: {},
            create: { memberId, tagId: data.tagId },
          })
        )
      )
    } else {
      await prisma.memberTag.deleteMany({
        where: { tagId: data.tagId, memberId: { in: data.memberIds } },
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
