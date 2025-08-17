import { NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { getSession } from '../../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../../lib/authz'
import { uploadFile, deleteFileByUrl } from '../../../../../../lib/storage'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; id: string }> }
) {
  const { org, id } = await params
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

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file)
    return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })

  const member = await prisma.member.findFirst({
    where: { id, organizationId: access.org.id },
    select: { id: true },
  })
  if (!member)
    return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploaded = await uploadFile(
    buffer,
    file.type || 'application/octet-stream',
    {
      prefix: `orgs/${access.org.id}/members/${member.id}`,
    }
  )

  // Delete previous photo if exists
  const prev = await prisma.member.findUnique({
    where: { id: member.id },
    select: { photoUrl: true },
  })

  await prisma.member.update({
    where: { id: member.id },
    data: { photoUrl: uploaded.url },
  })
  if (prev?.photoUrl) {
    try {
      await deleteFileByUrl(prev.photoUrl)
    } catch {}
  }
  return NextResponse.json({ ok: true, photoUrl: uploaded.url })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> }
) {
  const { org, id } = await params
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

  const member = await prisma.member.findFirst({
    where: { id, organizationId: access.org.id },
    select: { id: true, photoUrl: true },
  })
  if (!member)
    return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 })

  if (member.photoUrl) {
    await deleteFileByUrl(member.photoUrl)
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { photoUrl: null },
  })
  return NextResponse.json({ ok: true })
}
