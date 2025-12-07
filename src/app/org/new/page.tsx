import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewOrganizationForm from '@/app/org/new/ui'
import { isSuperAdmin } from '@/lib/authz'

export default async function NewOrganizationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  // Only superadmins can access this page in this phase
  const isSuper = await isSuperAdmin(session.user.id)
  if (!isSuper) redirect('/org')

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Yeni Dernek</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Sadece superadmin rolüne sahip kullanıcılar yeni dernek oluşturabilir.
      </p>
      <NewOrganizationForm />
    </main>
  )
}
