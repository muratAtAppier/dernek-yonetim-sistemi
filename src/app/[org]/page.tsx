import { ensureOrgAccessBySlug } from '../../lib/authz'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { redirect } from 'next/navigation'

export default async function OrgHomePage({
  params,
}: {
  params: { org?: string | string[] }
}) {
  const orgParam = params.org
  const org = Array.isArray(orgParam) ? orgParam[0] : (orgParam ?? '')
  if (!org) redirect('/org')

  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const access = await ensureOrgAccessBySlug(session.user!.id as string, org)
  if (access.notFound) return <div>Dernek bulunamadı.</div>
  if (!access.allowed)
    return <div className="p-6">Bu derneğe erişiminiz yok.</div>

  // Redirect org root to members for a focused workflow
  redirect(`/${org}/members`)
}
