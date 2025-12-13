import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import MeetingDetailClient from './MeetingDetailClient'

export const dynamic = 'force-dynamic'

export default async function MeetingDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ org: string; id: string }>
}) {
  const params = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/signin')
  }

  async function getMeeting() {
    try {
      const { ensureOrgAccessBySlug } = await import('@/lib/authz')
      const { prisma } = await import('@/lib/prisma')

      if (!session) return null as any

      const access = await ensureOrgAccessBySlug(
        session.user.id as string,
        params.org
      )
      if (!access.allowed) return null as any

      const meeting = await (prisma as any).meeting.findFirst({
        where: {
          id: params.id,
          organizationId: access.org.id,
        },
        include: {
          documents: true,
        },
      })

      return meeting
    } catch (e) {
      console.error('Error fetching meeting:', e)
      return null as any
    }
  }

  const meeting = await getMeeting()
  if (!meeting) return <div className="p-6">Toplantı bulunamadı.</div>

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: 'Toplantılar', href: `/${params.org}/meetings` },
          { label: meeting.title },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          {meeting.title}
        </h1>
      </div>
      <MeetingDetailClient
        org={params.org}
        meetingId={params.id}
        initialMeeting={meeting}
      />
    </main>
  )
}
