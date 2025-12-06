'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function CTA() {
  const { data: session } = useSession()
  const [roleInfo, setRoleInfo] = useState<{
    isSuperAdmin: boolean
    firstOrg: { slug: string; name: string } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchRoleInfo() {
      if (!session?.user?.id) {
        if (!cancelled) {
          setRoleInfo(null)
          setLoading(false)
        }
        return
      }

      try {
        const res = await fetch('/api/me/role', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) {
            setRoleInfo(null)
            setLoading(false)
          }
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setRoleInfo({
            isSuperAdmin: Boolean(json?.isSuper),
            firstOrg: json?.firstOrg || null,
          })
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setRoleInfo(null)
          setLoading(false)
        }
      }
    }
    fetchRoleInfo()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const isAuthed = Boolean(session?.user)

  // Determine the button href and text
  let buttonHref = '/auth/signin'
  let buttonText = 'Giriş Yap'

  if (isAuthed && !loading) {
    if (roleInfo?.isSuperAdmin) {
      buttonHref = '/org'
      buttonText = 'Derneklere Git'
    } else if (roleInfo?.firstOrg) {
      buttonHref = `/${roleInfo.firstOrg.slug}`
      buttonText = 'Derneğime Git'
    } else {
      buttonHref = '/org'
      buttonText = 'Derneklere Git'
    }
  }

  return (
    <section className="rounded-2xl border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl overflow-hidden relative">
      <div
        className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-8 py-12 text-center md:flex-row md:text-left">
        <div className="space-y-4 flex-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Dakikalar içinde başlayın
          </h2>
          <p className="text-lg text-primary-foreground/90 leading-relaxed max-w-xl">
            Kredi kartı gerekmez. Yerel olarak deneyebilir, hazır olunca buluta
            taşıyabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 text-sm text-primary-foreground/90 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ücretsiz başlangıç</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Kolay kurulum</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>7/24 destek</span>
            </div>
          </div>
        </div>
        {loading && isAuthed ? (
          <div className="h-12 w-40 animate-pulse rounded-md bg-primary-foreground/20" />
        ) : (
          <Link href={buttonHref}>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow group"
            >
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
