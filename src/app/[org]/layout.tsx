import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { ensureOrgAccessBySlug } from '../../lib/authz'
import { OrgNav } from '@/components/OrgNav'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
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

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">{access.org.name}</h1>
      </div>
      <OrgNav org={org} />
      <div className="mt-6">{children}</div>
    </section>
  )
}
