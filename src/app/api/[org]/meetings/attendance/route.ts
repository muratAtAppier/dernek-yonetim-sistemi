import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const UpsertAttendance = z.object({
  meetingId: z.string().min(1),
  rows: z
    .array(
      z.object({
        memberId: z.string(),
        present: z.boolean().optional(),
        representedByMemberId: z.string().nullable().optional(),
      })
    )
    .min(1),
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
    include: { attendance: true, proxies: true },
  })
  if (!meeting)
    return NextResponse.json({ error: 'Toplantı bulunamadı' }, { status: 404 })
  return NextResponse.json({
    attendance: meeting.attendance,
    proxies: meeting.proxies,
  })
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
    const data = UpsertAttendance.parse(json)
    const meeting = await (prisma as any).meeting.findFirst({
      where: { id: data.meetingId, organizationId: access.org.id },
    })
    if (!meeting)
      return NextResponse.json(
        { error: 'Toplantı bulunamadı' },
        { status: 404 }
      )

    // Upsert attendance rows
    await (prisma as any).$transaction(async (tx: any) => {
      for (const r of data.rows) {
        await tx.meetingAttendance.upsert({
          where: {
            meetingId_memberId: { meetingId: meeting.id, memberId: r.memberId },
          },
          update: {
            present: r.present ?? true,
            representedByMemberId: r.representedByMemberId ?? null,
          },
          create: {
            meetingId: meeting.id,
            memberId: r.memberId,
            present: r.present ?? true,
            representedByMemberId: r.representedByMemberId ?? null,
          },
        })
      }
    })

    const rows = await (prisma as any).meetingAttendance.findMany({
      where: { meetingId: meeting.id },
    })
    return NextResponse.json({ attendance: rows })
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
