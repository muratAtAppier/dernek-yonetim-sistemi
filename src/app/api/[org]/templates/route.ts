import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../lib/prisma'
import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../lib/authz'
import { slugify } from '../../../../lib/utils'

const UpsertSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
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
  const q = (url.searchParams.get('q') ?? '').trim()
  const where: any = { organizationId: access.org.id }
  if (q)
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ]
  const items = await (prisma as any).template.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
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
    const data = UpsertSchema.parse(body)
    const slug =
      data.slug && data.slug.length > 0 ? data.slug : slugify(data.name)
    const created = await (prisma as any).template.create({
      data: {
        organizationId: access.org.id,
        name: data.name,
        slug,
        description: data.description,
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
    if (e?.code === 'P2002')
      return NextResponse.json({ error: 'Slug zaten mevcut' }, { status: 409 })
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
