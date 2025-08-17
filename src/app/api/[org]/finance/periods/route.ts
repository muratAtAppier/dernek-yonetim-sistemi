import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const CreatePeriod = z.object({
  planId: z.string().min(1),
  name: z.string().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
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
  const planId = url.searchParams.get('planId') || undefined
  const items = await (prisma as any).duesPeriod.findMany({
    where: {
      ...(planId ? { planId } : {}),
      plan: { organizationId: access.org.id },
    },
    orderBy: [{ startDate: 'desc' }],
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
    const data = CreatePeriod.parse(body)

    const plan = await (prisma as any).duesPlan.findFirst({
      where: { id: data.planId, organizationId: access.org.id },
    })
    if (!plan)
      return NextResponse.json({ error: 'Plan bulunamadı' }, { status: 404 })

    const created = await (prisma as any).duesPeriod.create({
      data: {
        planId: data.planId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        dueDate: data.dueDate,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    if (String(e).includes('Unique'))
      return NextResponse.json(
        { error: 'Aynı isimde dönem mevcut' },
        { status: 409 }
      )
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
