import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug } from '@/lib/authz'
import { notFound, redirect } from 'next/navigation'
import { SmsHistoryList } from '@/components/SmsHistoryList'

export default async function SmsHistoryPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/${org}/sms`)
  }

  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound) {
    notFound()
  }
  if (!access.allowed) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SMS Gönderim Geçmişi</h1>
      </div>

      <SmsHistoryList org={org} />
    </div>
  )
}
