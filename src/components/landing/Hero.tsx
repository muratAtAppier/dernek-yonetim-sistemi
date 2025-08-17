import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 to-background">
      <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mx-auto mb-4 inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Çoklu Dernek Yönetimi – bulutta, güvenli ve hızlı
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Dernek Yönetimini Kolaylaştırın
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          Üyeler, aidatlar, kurul/komisyonlar, toplantı ve şablonlar. Hepsi tek bir modern arayüzde.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <LinkButton href="/auth/signin" className="px-6">Giriş Yap</LinkButton>
          <Link href="/org/new">
            <Button variant="outline" className="px-6">Hemen Başlayın</Button>
          </Link>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-24 -z-10 h-48 bg-gradient-to-t from-primary/10 to-transparent" />
    </section>
  )
}
