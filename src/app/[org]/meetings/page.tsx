import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LinkButton } from '@/components/ui/link-button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import MeetingsClient from './MeetingsClient'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage({
  params: paramsPromise,
  searchParams,
}: {
  params: Promise<{ org: string }>
  searchParams: Promise<{
    q?: string
    type?: string
    status?: string
    from?: string
    to?: string
  }>
}) {
  const params = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/signin')
  }

  async function getRole() {
    try {
      if (!session) return null as any
      const { ensureOrgAccessBySlug } = await import('@/lib/authz')
      const access = await ensureOrgAccessBySlug(
        session.user.id as string,
        params.org
      )
      if (!access.allowed) return null as any
      return access.role as 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'MEMBER'
    } catch {
      return null as any
    }
  }

  async function getMeetings() {
    try {
      const { ensureOrgAccessBySlug } = await import('@/lib/authz')
      const { prisma } = await import('@/lib/prisma')

      if (!session) return [] as any

      const access = await ensureOrgAccessBySlug(
        session.user.id as string,
        params.org
      )
      if (!access.allowed) return [] as any

      const sp = await searchParams
      const where: any = { organizationId: access.org.id }

      if (sp.type) where.type = sp.type
      if (sp.status) where.status = sp.status

      const items = await (prisma as any).meeting.findMany({
        where,
        orderBy: [{ scheduledAt: 'desc' }],
        take: 200,
      })

      return items as Array<any>
    } catch (e) {
      console.error('Error fetching meetings:', e)
      return [] as any
    }
  }

  const [role, meetings] = await Promise.all([getRole(), getMeetings()])
  const canWrite = role === 'SUPERADMIN' || role === 'ADMIN'
  const sp = await searchParams

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          Toplantılar
        </h1>
        <div className="flex gap-2">
          <LinkButton
            href={`/${params.org}/members`}
            size="sm"
            variant="outline"
          >
            Üyelere Dön
          </LinkButton>
        </div>
      </div>
      <form
        className="mb-4 flex gap-2"
        role="search"
        aria-label="Toplantı arama/filtre"
      >
        <Select name="type" defaultValue={sp.type ?? ''}>
          <option value="">Tüm türler</option>
          <option value="OLAGAN_GENEL_KURUL">
            Olağan Genel Kurul Toplantısı
          </option>
          <option value="OLAGANÜSTÜ_GENEL_KURUL">
            Olağanüstü Genel Kurul Toplantısı
          </option>
        </Select>
        <Button type="submit" variant="outline">
          Filtrele
        </Button>
        <LinkButton href={`/${params.org}/meetings`} variant="outline">
          Sıfırla
        </LinkButton>
      </form>
      <MeetingsClient
        org={params.org}
        canWrite={canWrite}
        initialItems={meetings}
        hasActiveFilters={!!sp.type}
      />
    </main>
  )
}
