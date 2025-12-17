import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'
import { prisma } from '../../../../../lib/prisma'
import { sendBulkEmail } from '../../../../../lib/email/service'

const Body = z.object({
  subject: z.string().min(1).max(500),
  message: z.string().min(1),
  memberIds: z.array(z.string().min(1)),
})

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
    const parsed = Body.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { subject, message, memberIds } = parsed.data

    if (!memberIds.length)
      return NextResponse.json(
        { error: 'En az bir üye gerekli' },
        { status: 400 }
      )

    const result = await sendBulkEmail({
      organizationId: access.org.id,
      memberIds,
      subject,
      message,
      personalize: true,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: 'Server error', detail: e?.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
