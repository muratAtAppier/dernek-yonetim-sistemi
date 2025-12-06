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
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { ensureOrgAccessBySlug } from '@/lib/authz'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>
  searchParams: Promise<{
    q?: string
    status?: string
    title?: string | string[]
    cursor?: string
    imported?: string
    created?: string
    updated?: string
    skipped?: string
    errors?: string
    tpl?: string
    sort?: string
    dir?: 'asc' | 'desc'
  }>
}) {
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
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL &&
    process.env.NEXT_PUBLIC_BASE_URL.length > 0
      ? process.env.NEXT_PUBLIC_BASE_URL
      : host
        ? `${proto}://${host}`
        : ''

  async function getMembers() {
    try {
      const q = (_sp.q ?? '').trim()
      const status = (_sp.status ?? '').trim()
      const titleParam = _sp.title
      const cursor = (_sp.cursor ?? '').trim()
      const sort = String((_sp as any).sort ?? '').trim()
      const dir = String((_sp as any).dir ?? 'desc').toLowerCase()
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
      if (status && ['ACTIVE', 'PASSIVE', 'LEFT'].includes(status))
        where.status = status

      // Handle title filtering
      const titleIds = (
        Array.isArray(titleParam) ? titleParam : titleParam ? [titleParam] : []
      ).map(String)
      // Filter out __ALL__ - if __ALL__ is selected, don't apply title filter
      const filteredTitleIds = titleIds.filter((t) => t !== '__ALL__')
      if (filteredTitleIds.length > 0) {
        // Separate null from actual title values
        const hasNull = filteredTitleIds.includes('null')
        const actualTitles = filteredTitleIds.filter((t) => t !== 'null')

        if (hasNull && actualTitles.length > 0) {
          // Both null and actual titles selected - need to use AND with OR for titles
          const titleCondition = {
            OR: [{ title: { in: actualTitles } }, { title: null }],
          }
          if (where.OR) {
            // If there's already an OR (from search query), wrap it in AND
            const searchOr = where.OR
            delete where.OR
            if (Array.isArray(where.AND))
              where.AND.push({ OR: searchOr }, titleCondition)
            else if (where.AND)
              where.AND = [where.AND, { OR: searchOr }, titleCondition]
            else where.AND = [{ OR: searchOr }, titleCondition]
          } else {
            where.AND = [titleCondition]
          }
        } else if (hasNull) {
          // Only null selected
          where.title = null
        } else if (actualTitles.length > 0) {
          // Only actual titles selected
          where.title =
            actualTitles.length === 1 ? actualTitles[0] : { in: actualTitles }
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
      const nextCursor = hasMore
        ? (sliced[sliced.length - 1]?.id ?? null)
        : null
      return { items: sliced as any[], nextCursor }
    } catch {
      return { items: [], nextCursor: null as string | null }
    }
  }

  const members = await getMembers()
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

  // normalize title selection for form default value
  const selectedTitles = Array.isArray(_sp.title)
    ? _sp.title
    : _sp.title
      ? [_sp.title]
      : []
  const initialTemplateSlug = String((_sp as any).tpl ?? '').trim()
  const currentSort = {
    sort: String((_sp as any).sort ?? ''),
    dir: String((_sp as any).dir ?? 'desc').toLowerCase() as 'asc' | 'desc',
  }

  // Define all possible MemberTitle values
  const allTitles = [
    { value: '__ALL__', label: 'Hepsi' },
    { value: 'BASKAN', label: 'Yönetim Kurulu Başkanı' },
    { value: 'BASKAN_YARDIMCISI', label: 'Yönetim Kurulu Başkan Yardımcısı' },
    { value: 'SEKRETER', label: 'Sekreter' },
    { value: 'SAYMAN', label: 'Sayman' },
    { value: 'YONETIM_KURULU_ASIL', label: 'Yönetim Kurulu Üyesi (Asil)' },
    { value: 'DENETIM_KURULU_BASKANI', label: 'Denetim Kurulu Başkanı' },
    { value: 'DENETIM_KURULU_ASIL', label: 'Denetim Kurulu Üyesi (Asil)' },
    { value: 'YONETIM_KURULU_YEDEK', label: 'Yönetim Kurulu Üyesi (Yedek)' },
    { value: 'DENETIM_KURULU_YEDEK', label: 'Denetim Kurulu Üyesi (Yedek)' },
    { value: 'UYE', label: 'Üye' },
    { value: 'null', label: 'Statü yok' },
  ]

  // If no titles selected or __ALL__ selected, default to __ALL__
  const defaultSelectedTitles =
    selectedTitles.length === 0 || selectedTitles.includes('__ALL__')
      ? ['__ALL__']
      : selectedTitles

  return (
    <main>
      {/* Import Success Banner */}
      {summary && (
        <div className="mb-6 rounded-lg border-2 border-green-500/20 bg-green-50 dark:bg-green-950/20 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                İçe aktarma başarıyla tamamlandı!
              </h3>
              <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-medium">
                    ✓ Oluşturulan: {summary.created}
                  </span>
                  <span className="font-medium">
                    ↻ Güncellenen: {summary.updated}
                  </span>
                  <span className="text-green-600 dark:text-green-500">
                    ⊝ Atlanan: {summary.skipped}
                  </span>
                  {summary.errors > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      ✗ Hatalı: {summary.errors}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Üyeler</h1>
            <p className="text-muted-foreground mt-1"></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <>
                <LinkButton
                  href={`/${org}/members/import`}
                  size="sm"
                  variant="outline"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  İçe Aktar
                </LinkButton>
                <LinkButton href={`/${org}/members/new`} size="sm">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Yeni Üye
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <details open className="mb-6 rounded-lg border bg-card shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-accent/50 rounded-t-lg transition-colors flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtreler
        </summary>
        <form className="p-4 space-y-4 border-t bg-accent/5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="search-input"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Ara
              </label>
              <Input
                id="search-input"
                name="q"
                defaultValue={_sp.q ?? ''}
                placeholder="İsim, email, telefon, TC..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="status-select"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Durum
              </label>
              <Select
                id="status-select"
                name="status"
                defaultValue={_sp.status ?? ''}
                className="h-10"
              >
                <option value="">Tüm durumlar</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PASSIVE">Pasif</option>
                <option value="LEFT">Ayrıldı</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="title-select"
                className="text-sm font-medium text-foreground flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Kişi Statüsü
              </label>
              <MultiSelectDropdown
                name="title"
                options={allTitles}
                defaultValue={defaultSelectedTitles}
                placeholder="Statü seçin..."
                allOptionValue="__ALL__"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t">
            <LinkButton href={`/${org}/members`} variant="ghost" size="sm">
              Sıfırla
            </LinkButton>
            <Button type="submit" size="sm">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtrele
            </Button>
          </div>
        </form>
      </details>

      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed bg-card p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Henüz üye bulunmuyor
              </h3>
              <p className="text-muted-foreground text-sm">
                Derneğinize üye ekleyerek başlayın veya toplu olarak içe
                aktarın.
              </p>
            </div>
            {canWrite && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <LinkButton href={`/${org}/members/new`} size="default">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Yeni Üye Ekle
                </LinkButton>
                <LinkButton
                  href={`/${org}/members/import`}
                  variant="outline"
                  size="default"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Toplu İçe Aktar
                </LinkButton>
              </div>
            )}
          </div>
        </div>
      ) : (
        <MembersClient
          org={org}
          canWrite={canWrite}
          initialItems={items as any}
          initialNextCursor={nextCursor}
          q={_sp.q}
          status={_sp.status}
          titles={defaultSelectedTitles as string[]}
          initialTemplateSlug={initialTemplateSlug || undefined}
        />
      )}
      <StickyActions org={org} canWrite={canWrite} />
    </main>
  )
}
