'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function StickyActions({ org, canWrite }: { org: string; canWrite: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop
      setShow(y > 180)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!canWrite) return null

  return (
    <div
      className={[
        'fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 transition-opacity',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!show}
    >
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
        <Link href={`/${org}/members/new`}>
          <Button size="sm">Yeni Üye</Button>
        </Link>
      </div>
    </div>
  )
}
