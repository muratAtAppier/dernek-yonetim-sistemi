import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ensureOrgAccessBySlug } from '@/lib/authz'
import { prisma } from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound) return <div>Dernek bulunamadı.</div>
  if (!access.allowed)
    return <div className="p-6">Bu derneğe erişiminiz yok.</div>

  const role = access.role as 'SUPERADMIN' | 'ADMIN' | null
  const canWrite = role === 'SUPERADMIN' || role === 'ADMIN'

  // Fetch full organization details with admin users
  const organization = await prisma.organization.findUnique({
    where: { slug: org },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      logoUrl: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: {
          role: 'ADMIN', // Only show org-level admins, not SUPERADMIN
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!organization) {
    return <div>Dernek bulunamadı.</div>
  }

  // Transform memberships to admin users
  const adminUsers = organization.memberships.map((m) => ({
    id: m.user.id,
    membershipId: m.id,
    firstName: m.user.firstName || '',
    lastName: m.user.lastName || '',
    email: m.user.email || '',
    role: m.role,
  }))

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dernek Ayarları</h1>
        <p className="text-muted-foreground mt-1">
          Dernek bilgilerini görüntüleyin ve düzenleyin
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <SettingsClient
          org={org}
          initialData={{
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            description: organization.description,
            address: organization.address,
            phone: organization.phone,
            email: organization.email,
            website: organization.website,
            logoUrl: organization.logoUrl,
            createdAt: organization.createdAt.toISOString(),
            updatedAt: organization.updatedAt.toISOString(),
          }}
          adminUsers={adminUsers}
          canWrite={canWrite}
        />
      </div>
    </main>
  )
}
