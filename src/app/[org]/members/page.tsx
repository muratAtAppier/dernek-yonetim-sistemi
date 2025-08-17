import Link from 'next/link'
import { authOptions } from '../../../lib/auth'
import { getServerSession } from 'next-auth'
import { MembersClient } from './MembersClient'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { SortHeader } from '@/components/ui/sort-header'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StickyActions } from './StickyActions'
import { ensureOrgAccessBySlug } from '@/lib/authz'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function MembersPage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ q?: string; status?: string; tag?: string | string[]; group?: string | string[]; cursor?: string; imported?: string; created?: string; updated?: string; skipped?: string; errors?: string; tagsMode?: string; tagMode?: string; groupsMode?: string; tpl?: string; sort?: string; dir?: 'asc' | 'desc' }> }) {
  const { org } = await params
  const _sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  const role = access.role as 'SUPERADMIN' | 'ADMIN' | null
  const canWrite = role === 'SUPERADMIN' || role === 'ADMIN'

  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') ?? ''
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? ''
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.length > 0)
    ? process.env.NEXT_PUBLIC_BASE_URL
    : (host ? `${proto}://${host}` : '')

  async function getTags() {
    try {
  const res = await fetch(`${baseUrl}/api/${org}/members/tags`, { cache: 'no-store', headers: { cookie: cookieHeader } })
      if (!res.ok) return [] as Array<{ id: string; name: string }>
      const data = await res.json()
      return data.items as Array<{ id: string; name: string }>
    } catch {
      return [] as Array<{ id: string; name: string }>
    }
  }

  async function getGroups() {
    try {
  const res = await fetch(`${baseUrl}/api/${org}/members/groups`, { cache: 'no-store', headers: { cookie: cookieHeader } })
      if (!res.ok) return [] as Array<{ id: string; name: string; type: 'GROUP' | 'COMMISSION' }>
      const data = await res.json()
      return data.items as Array<{ id: string; name: string; type: 'GROUP' | 'COMMISSION' }>
    } catch {
      return [] as Array<{ id: string; name: string; type: 'GROUP' | 'COMMISSION' }>
    }
  }

  async function getMembers() {
    try {
  const q = (_sp.q ?? '').trim()
  const status = (_sp.status ?? '').trim()
  const tagParam = _sp.tag
  const groupParam = _sp.group
  const cursor = (_sp.cursor ?? '').trim()
  const tagsMode = String(_sp.tagsMode ?? _sp.tagMode ?? 'or').toLowerCase()
  const groupsMode = String(_sp.groupsMode ?? 'or').toLowerCase()
      const sort = String((_sp as any).sort ?? '').trim()
      const dir = String(((_sp as any).dir ?? 'desc')).toLowerCase()
      // Build Prisma where/orderBy like API for server-side query
      const where: any = { organizationId: access.org.id }
      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { nationalId: { contains: q, mode: 'insensitive' } },
        ]
      }
      if (status && ['ACTIVE', 'PASSIVE', 'LEFT'].includes(status)) where.status = status
      const tagIds = (Array.isArray(tagParam) ? tagParam : (tagParam ? [tagParam] : [])).map(String)
      const groupIds = (Array.isArray(groupParam) ? groupParam : (groupParam ? [groupParam] : [])).map(String)
      if (tagIds.length > 0) {
        if (tagsMode === 'and') {
          const andClauses = tagIds.map((id) => ({ tags: { some: { tagId: id } } }))
          if (Array.isArray(where.AND)) where.AND.push(...andClauses)
          else if (where.AND) where.AND = [where.AND, ...andClauses]
          else where.AND = andClauses
        } else {
          where.tags = tagIds.length === 1 ? { some: { tagId: tagIds[0] } } : { some: { tagId: { in: tagIds } } }
        }
      }
      if (groupIds.length > 0) {
        if (groupsMode === 'and') {
          const andClauses = groupIds.map((id) => ({ groups: { some: { groupId: id } } }))
          if (Array.isArray(where.AND)) where.AND.push(...andClauses)
          else if (where.AND) where.AND = [where.AND, ...andClauses]
          else where.AND = andClauses
        } else {
          where.groups = groupIds.length === 1 ? { some: { groupId: groupIds[0] } } : { some: { groupId: { in: groupIds } } }
        }
      }
      let orderBy: any = [{ createdAt: 'desc' }]
      const dirFinal: 'asc' | 'desc' = dir === 'asc' ? 'asc' : 'desc'
      switch (sort) {
        case 'name':
          orderBy = [{ lastName: dirFinal }, { firstName: dirFinal }]
          break
        case 'firstName':
        case 'lastName':
        case 'createdAt':
        case 'joinedAt':
        case 'status':
          orderBy = [{ [sort]: dirFinal }]
          break
        default:
          orderBy = [{ createdAt: 'desc' }]
      }
      const takeParam = 20
      const take = Math.min(Math.max(takeParam, 1), 200) + 1
      const items = await prisma.member.findMany({
        where,
        orderBy,
        ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          nationalId: true,
          status: true,
        },
      })
      const hasMore = items.length === take
      const sliced = hasMore ? items.slice(0, take - 1) : items
      const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null
      return { items: sliced as any[], nextCursor }
    } catch {
      return { items: [], nextCursor: null as string | null }
    }
  }

  const [tags, groups, members] = await Promise.all([getTags(), getGroups(), getMembers()])
  const { items, nextCursor } = members

  const imported = _sp.imported === '1'
  const summary = imported
    ? {
    created: Number(_sp.created ?? '0') || 0,
    updated: Number(_sp.updated ?? '0') || 0,
    skipped: Number(_sp.skipped ?? '0') || 0,
    errors: Number(_sp.errors ?? '0') || 0,
      }
    : null

  // normalize tag and group selection for form default value
  const selectedTags = Array.isArray(_sp.tag) ? _sp.tag : (_sp.tag ? [_sp.tag] : [])
  const selectedGroups = Array.isArray(_sp.group) ? _sp.group : (_sp.group ? [_sp.group] : [])
  const selectedTagsMode = String(_sp.tagsMode ?? _sp.tagMode ?? 'or').toLowerCase()
  const selectedGroupsMode = String(_sp.groupsMode ?? 'or').toLowerCase()
  const initialTemplateSlug = String((_sp as any).tpl ?? '').trim()
  const currentSort = { sort: String((_sp as any).sort ?? ''), dir: (String(((_sp as any).dir ?? 'desc')).toLowerCase() as 'asc' | 'desc') }

  return (
    <main>
      <Breadcrumbs items={[{ label: 'Üyeler', href: `/${org}/members` }]} />
      {summary && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 px-3 py-2 text-sm">
          İçe aktarma tamamlandı. Oluşturulan: {summary.created}, Güncellenen: {summary.updated}, Atlanan: {summary.skipped}, Hatalı: {summary.errors}
        </div>
      )}
  <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Üyeler</h1>
        <div className="flex gap-2">
          <LinkButton
            href={`/api/${org}/pdf/hazirun`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
            title="Hazirun PDF indir"
          >
            Hazirun PDF indir
          </LinkButton>
          {canWrite && (
            <>
              <LinkButton href={`/${org}/members/import`} size="sm" variant="outline">İçe Aktar</LinkButton>
              <LinkButton href={`/${org}/members/new`} size="sm">Yeni Üye</LinkButton>
            </>
          )}
        </div>
      </div>
  <details className="mb-4 rounded-md border bg-card">
        <summary className="cursor-pointer list-none px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          Filtreler
        </summary>
        <form className="p-3 grid gap-2 sm:grid-cols-6 border-t">
        <Input name="q" defaultValue={_sp.q ?? ''} placeholder="Ara..." />
        <Select name="status" defaultValue={_sp.status ?? ''}>
          <option value="">Tüm durumlar</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PASSIVE">PASSIVE</option>
          <option value="LEFT">LEFT</option>
        </Select>
        <Select name="tag" multiple defaultValue={selectedTags as any} className="h-24">
          <option value="">Tüm etiketler</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <Select name="group" multiple defaultValue={selectedGroups as any} className="h-24">
          <option value="">Tüm gruplar/komisyonlar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.type === 'COMMISSION' ? 'Komisyon' : 'Grup'})</option>
          ))}
        </Select>
        <Select name="tagsMode" defaultValue={selectedTagsMode as any}>
          <option value="or">Etiket Modu: OR</option>
          <option value="and">Etiket Modu: AND</option>
        </Select>
        <Select name="groupsMode" defaultValue={selectedGroupsMode as any}>
          <option value="or">Grup Modu: OR</option>
          <option value="and">Grup Modu: AND</option>
        </Select>
  <Button type="submit" variant="outline">Filtrele</Button>
  <LinkButton href={`/${org}/members`} size="sm" variant="outline">Sıfırla</LinkButton>
        <div className="sm:col-span-6 mt-2 text-xs text-muted-foreground">
          Sıralama:
          <span className="ml-2 inline-flex items-center gap-3">
            <SortHeader hrefBase={`/${org}/members`} current={currentSort} field="createdAt">Oluşturma</SortHeader>
            <SortHeader hrefBase={`/${org}/members`} current={currentSort} field="name">Ad Soyad</SortHeader>
            <SortHeader hrefBase={`/${org}/members`} current={currentSort} field="status">Durum</SortHeader>
            <SortHeader hrefBase={`/${org}/members`} current={currentSort} field="joinedAt">Katılım</SortHeader>
          </span>
        </div>
        </form>
      </details>
      {items.length === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">Üye yok.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          {canWrite && (
            <div>
              <LinkButton href={`/${org}/members/new`}>Yeni Üye Ekle</LinkButton>
            </div>
          )}
        </div>
      ) : (
  <MembersClient org={org} canWrite={canWrite} initialItems={items as any} initialNextCursor={nextCursor} q={_sp.q} status={_sp.status} tags={selectedTags as string[]} tagsMode={selectedTagsMode as 'or' | 'and'} groups={selectedGroups as string[]} groupsMode={selectedGroupsMode as 'or' | 'and'} initialTemplateSlug={initialTemplateSlug || undefined} />
      )}
  <StickyActions org={org} canWrite={canWrite} />
    </main>
  )
}
