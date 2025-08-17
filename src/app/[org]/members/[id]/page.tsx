import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { LinkButton } from '@/components/ui/link-button'

export default async function MemberDetailPage({ params }: { params: { org: string; id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/signin')
  }

  async function getMember() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/${params.org}/members/${params.id}`, { cache: 'no-store' })
      if (!res.ok) return null as any
      const data = await res.json()
      return data.item as any
    } catch { return null as any }
  }

  const item = await getMember()
  if (!item) return <div className="p-6">Üye bulunamadı.</div>

  return (
    <main>
      <Breadcrumbs items={[{ label: 'Üyeler', href: `/${params.org}/members` }, { label: item.firstName + ' ' + item.lastName }]} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">{item.firstName} {item.lastName}</h1>
        <div className="flex items-center gap-2">
          <LinkButton href={`/${params.org}/members/${params.id}/edit`} size="sm" variant="outline">Düzenle</LinkButton>
          <LinkButton href={`/${params.org}/members`} size="sm" variant="outline">Listeye Dön</LinkButton>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded border bg-card p-3 text-sm">
          <div className="grid grid-cols-3 gap-y-2">
            <div className="text-muted-foreground">E-posta</div>
            <div className="col-span-2">{item.email || '-'}</div>
            <div className="text-muted-foreground">Telefon</div>
            <div className="col-span-2">{item.phone || '-'}</div>
            <div className="text-muted-foreground">TC</div>
            <div className="col-span-2">{item.nationalId || '-'}</div>
            <div className="text-muted-foreground">Durum</div>
            <div className="col-span-2">{item.status}</div>
            <div className="text-muted-foreground">Kayıt</div>
            <div className="col-span-2">{item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : '-'}</div>
          </div>
          {item.address && (
            <div className="mt-3">
              <div className="text-muted-foreground">Adres</div>
              <div>{item.address}</div>
            </div>
          )}
          {item.occupation && (
            <div className="mt-3">
              <div className="text-muted-foreground">Meslek</div>
              <div>{item.occupation}</div>
            </div>
          )}
        </section>
        <section className="rounded border bg-card p-3 text-sm">
          <div className="text-muted-foreground">Fotoğraf</div>
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="Üye fotoğrafı" className="mt-2 w-40 h-40 object-cover rounded border" />
          ) : (
            <div className="mt-2 text-muted-foreground">Fotoğraf yok</div>
          )}
        </section>
      </div>
    </main>
  )
}
