'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function HeaderActions() {
  const { data } = useSession()
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!data?.user?.id) {
        if (!cancelled) setIsSuper(false)
        return
      }
      try {
        const res = await fetch('/api/me/role', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setIsSuper(false)
          return
        }
        const json = await res.json()
        if (!cancelled) setIsSuper(Boolean(json?.isSuper))
      } catch {
        if (!cancelled) setIsSuper(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [data?.user?.id])

  if (!data?.user) {
    return (
      <Button size="sm" variant="outline" onClick={() => signIn(undefined, { callbackUrl: '/org' })}>Giriş</Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isSuper && <Badge variant="secondary">SUPERADMIN</Badge>}
      {isSuper && (
        <Link href="/org/new">
          <Button size="sm">Yeni Dernek</Button>
        </Link>
      )}
      <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Çıkış</Button>
    </div>
  )
}
