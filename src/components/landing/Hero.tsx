'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { useSession } from 'next-auth/react'

export default function Hero() {
  const { data: session, status } = useSession()
  const isAuthed = Boolean(session?.user)
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 to-background">
      <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Dernek Yönetimini Kolaylaştırın
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          Üyeler, aidatlar, kurul/komisyonlar, toplantı ve şablonlar. Hepsi tek
          bir modern arayüzde.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 min-h-[44px]">
          {isAuthed ? (
            <LinkButton href="/org" className="px-6">
              Dernekler
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/auth/signin" className="px-6">
                Giriş Yap
              </LinkButton>
              <Link href="/org/new">
                <Button variant="outline" className="px-6">
                  Hemen Başlayın
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-24 -z-10 h-48 bg-gradient-to-t from-primary/10 to-transparent"
      />
    </section>
  )
}
