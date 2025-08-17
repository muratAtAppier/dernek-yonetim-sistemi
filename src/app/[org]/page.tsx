import { ensureOrgAccessBySlug } from '../../lib/authz'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ org?: string | string[] }>
}) {
  const p = await params
  const org = Array.isArray(p.org) ? p.org[0] : p.org ?? ''
  const session = await getServerSession(authOptions)
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/signin')
  }
  const access = await ensureOrgAccessBySlug(session!.user!.id as string, org)
  if (access.notFound) return <div>Dernek bulunamadı.</div>
  if (!access.allowed) return <div className="p-6">Bu derneğe erişiminiz yok.</div>

  const { redirect } = await import('next/navigation')
  // Redirect org root to members for a focused workflow
  redirect(`/${org}/members`)
}
