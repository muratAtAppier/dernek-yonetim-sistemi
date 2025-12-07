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
  title: string | null
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
  titles,
  initialTemplateSlug,
}: {
  org: string
  canWrite: boolean
  initialItems: MemberItem[]
  initialNextCursor: string | null
  q?: string
  status?: string
  titles?: string[]
  initialTemplateSlug?: string
}) {
  const [items, setItems] = React.useState<MemberItem[]>(initialItems)
  const [nextCursor, setNextCursor] = React.useState<string | null>(
    initialNextCursor
  )
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
      if (Array.isArray(titles))
        titles.forEach((t) => params.append('title', t))
      const res = await fetch(`/api/${org}/members?` + params.toString(), {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Liste yüklenemedi')
      const data = await res.json()
      setItems((prev) => [...prev, ...(data.items || [])])
      setNextCursor(data.nextCursor || null)
    } catch (e: any) {
      add({ variant: 'error', title: 'Yükleme hatası', description: e.message })
    } finally {
      setLoading(false)
    }
  }, [add, nextCursor, loading, org, q, status, titles])

  React.useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <div>
      <MemberSelectableList
        items={items}
        org={org}
        canWrite={canWrite}
        q={q}
        status={status}
      />
      {nextCursor && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            size="default"
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Yükleniyor...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Daha Fazla Yükle
              </>
            )}
          </Button>
          <div ref={sentinelRef} className="h-1 w-full" />
        </div>
      )}
    </div>
  )
}
