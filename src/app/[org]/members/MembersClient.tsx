'use client'

import React from 'react'
import { MemberSelectableList } from '../../../components/MemberSelectableList'
import { useToast } from '../../../components/ui/toast'
import { Button } from '@/components/ui/button'

export type MemberItem = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  status: 'ACTIVE' | 'PASSIVE' | 'LEFT'
  // optional tags included by API enrichment
  tags?: Array<{ id: string; name: string; color?: string | null }>
}

export function MembersClient({
  org,
  canWrite,
  initialItems,
  initialNextCursor,
  q,
  status,
  tags,
  tagsMode = 'or',
  groups,
  groupsMode = 'or',
  initialTemplateSlug,
}: {
  org: string
  canWrite: boolean
  initialItems: MemberItem[]
  initialNextCursor: string | null
  q?: string
  status?: string
  tags?: string[]
  tagsMode?: 'or' | 'and'
  groups?: string[]
  groupsMode?: 'or' | 'and'
  initialTemplateSlug?: string
}) {
  const [items, setItems] = React.useState<MemberItem[]>(initialItems)
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor)
  const [loading, setLoading] = React.useState(false)
  const { add } = useToast()
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  const loadMore = React.useCallback(async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ take: '20', cursor: nextCursor })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      if (Array.isArray(tags)) tags.forEach((t) => params.append('tag', t))
      if (tagsMode) params.set('tagsMode', tagsMode)
      if (Array.isArray(groups)) groups.forEach((g) => params.append('group', g))
      if (groupsMode) params.set('groupsMode', groupsMode)
      const res = await fetch(`/api/${org}/members?` + params.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Liste yüklenemedi')
      const data = await res.json()
      setItems((prev) => [...prev, ...(data.items || [])])
      setNextCursor(data.nextCursor || null)
    } catch (e: any) {
      add({ variant: 'error', title: 'Yükleme hatası', description: e.message })
    } finally {
      setLoading(false)
    }
  }, [add, nextCursor, loading, org, q, status, tags, tagsMode, groups, groupsMode])

  React.useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting) {
        loadMore()
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <div>
      <MemberSelectableList items={items} org={org} canWrite={canWrite} q={q} status={status} selectedTags={tags} tagsMode={tagsMode} selectedGroups={groups} groupsMode={groupsMode} />
      {nextCursor && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? 'Yükleniyor...' : 'Daha fazla yükle'}
          </Button>
          <div ref={sentinelRef} className="h-1 w-full" />
        </div>
      )}
    </div>
  )
}
