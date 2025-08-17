import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ org: string; slug: string }> }
) {
  const { org, slug } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const item = await (prisma as any).template.findFirst({
    where: { organizationId: access.org.id, slug },
  })
  if (!item)
    return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; slug: string }> }
) {
  const { org, slug } = await params
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
    const data = UpdateSchema.parse(body)
    const updated = await (prisma as any).template.update({
      where: {
        organizationId_slug: {
          organizationId: access.org.id,
          slug,
        },
      },
      data,
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ org: string; slug: string }> }
) {
  const { org, slug } = await params
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

  await (prisma as any).template.delete({
    where: {
      organizationId_slug: { organizationId: access.org.id, slug },
    },
  })
  return NextResponse.json({ ok: true })
}
