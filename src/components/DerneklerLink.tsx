'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function DerneklerLink() {
  const { data, status } = useSession()
  const [isSuper, setIsSuper] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!data?.user?.id) {
        if (!cancelled) setIsSuper(null)
        return
      }
      try {
        const res = await fetch('/api/me/role', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setIsSuper(null)
          return
        }
        const json = await res.json()
        if (!cancelled) setIsSuper(Boolean(json?.isSuper))
      } catch {
        if (!cancelled) setIsSuper(null)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [data?.user?.id])

  // Hide the "Dernekler" link for all users (including SUPERADMIN)
  return null
}
