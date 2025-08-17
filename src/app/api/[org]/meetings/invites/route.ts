import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const CreateInvites = z.object({
  meetingId: z.string().min(1),
  memberIds: z.array(z.string()).min(1),
})

const UpdateInviteStatus = z.object({
  meetingId: z.string().min(1),
  memberId: z.string().min(1),
  status: z.enum(['PENDING', 'SENT', 'ACCEPTED', 'DECLINED']),
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
  const meetingId = url.searchParams.get('meetingId') || ''
  if (!meetingId)
    return NextResponse.json({ error: 'meetingId gerekli' }, { status: 400 })

  const meeting = await (prisma as any).meeting.findFirst({
    where: { id: meetingId, organizationId: access.org.id },
    include: { invites: { include: { member: true } } },
  })
  if (!meeting)
    return NextResponse.json({ error: 'Toplantı bulunamadı' }, { status: 404 })
  return NextResponse.json({ items: meeting.invites })
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
    const data = CreateInvites.parse(json)

    const meeting = await (prisma as any).meeting.findFirst({
      where: { id: data.meetingId, organizationId: access.org.id },
    })
    if (!meeting)
      return NextResponse.json(
        { error: 'Toplantı bulunamadı' },
        { status: 404 }
      )

    await (prisma as any).$transaction(async (tx: any) => {
      for (const memberId of data.memberIds) {
        await tx.meetingInvite.upsert({
          where: { meetingId_memberId: { meetingId: meeting.id, memberId } },
          update: {},
          create: { meetingId: meeting.id, memberId },
        })
      }
    })

    const items = await (prisma as any).meetingInvite.findMany({
      where: { meetingId: meeting.id },
    })
    return NextResponse.json({ items })
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
    const json = await req.json()
    const data = UpdateInviteStatus.parse(json)
    const meeting = await (prisma as any).meeting.findFirst({
      where: { id: data.meetingId, organizationId: access.org.id },
    })
    if (!meeting)
      return NextResponse.json(
        { error: 'Toplantı bulunamadı' },
        { status: 404 }
      )

    const updated = await (prisma as any).meetingInvite.update({
      where: {
        meetingId_memberId: { meetingId: meeting.id, memberId: data.memberId },
      },
      data: {
        status: data.status,
        respondedAt: data.status === 'PENDING' ? null : new Date(),
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
