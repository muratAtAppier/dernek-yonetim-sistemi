import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const CreateDecision = z.object({
  meetingId: z.string().min(1),
  title: z.string().min(2),
  content: z.string().min(2),
  decisionNo: z.string().optional(),
  decisionDate: z.preprocess(
    (v) => (v ? new Date(v as any) : undefined),
    z.date().optional()
  ),
})

const DeleteDecision = z.object({ id: z.string().min(1) })

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
    include: { decisions: true },
  })
  if (!meeting)
    return NextResponse.json({ error: 'Toplantı bulunamadı' }, { status: 404 })
  return NextResponse.json({ items: meeting.decisions })
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
    const data = CreateDecision.parse(json)

    const meeting = await (prisma as any).meeting.findFirst({
      where: { id: data.meetingId, organizationId: access.org.id },
    })
    if (!meeting)
      return NextResponse.json(
        { error: 'Toplantı bulunamadı' },
        { status: 404 }
      )

    const created = await (prisma as any).meetingDecision.create({
      data: {
        meetingId: meeting.id,
        title: data.title,
        content: data.content,
        decisionNo: data.decisionNo,
        decisionDate: data.decisionDate ?? new Date(),
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

  const existing = await (prisma as any).meetingDecision.findUnique({
    where: { id },
  })
  if (!existing)
    return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })

  await (prisma as any).meetingDecision.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
