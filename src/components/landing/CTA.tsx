import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
    <section className="rounded-2xl border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 text-center md:flex-row md:text-left">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dakikalar içinde başlayın</h2>
          <p className="mt-1 text-primary-foreground/80">Kredi kartı gerekmez. Yerel olarak deneyebilir, hazır olunca buluta taşıyabilirsiniz.</p>
        </div>
        <Link href="/auth/signin">
          <Button size="lg" variant="secondary">Giriş Yap</Button>
        </Link>
      </div>
    </section>
  )
}
