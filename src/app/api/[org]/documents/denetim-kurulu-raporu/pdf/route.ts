import { NextResponse } from 'next/server'
import { getSession } from '../../../../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../../../../lib/authz'

export const runtime = 'nodejs'

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

  // This endpoint is a placeholder for future implementation
  return NextResponse.json(
    {
      message:
        'Denetim Kurulu Raporu PDF generation is not yet implemented. Please use the preview page.',
    },
    { status: 501 }
  )
}
