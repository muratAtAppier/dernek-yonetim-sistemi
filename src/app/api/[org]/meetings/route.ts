import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const CreateMeeting = z.object({
  title: z.string().min(2),
  scheduledAt: z.preprocess(
    (v) =>
      typeof v === 'string' || v instanceof Date ? new Date(v as any) : v,
    z.date()
  ),
  type: z.enum(['GENERAL_ASSEMBLY', 'BOARD', 'COMMISSION', 'OTHER']).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
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
  const status = url.searchParams.get('status') as any
  const type = url.searchParams.get('type') as any
  const where: any = { organizationId: access.org.id }
  if (status) where.status = status
  if (type) where.type = type

  const items = await (prisma as any).meeting.findMany({
    where,
    orderBy: [{ scheduledAt: 'desc' }],
    take: 200,
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
    const data = CreateMeeting.parse(json)
    const created = await (prisma as any).meeting.create({
      data: {
        organizationId: access.org.id,
        title: data.title,
        scheduledAt: data.scheduledAt,
        type: data.type ?? 'OTHER',
        location: data.location,
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
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
