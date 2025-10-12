import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Hero from '@/components/landing/Hero'
import FeatureCard from '@/components/landing/FeatureCard'
import Footer from '@/components/landing/Footer'
import Reveal from '@/components/landing/Reveal'
import {
  Users,
  CreditCard,
  PieChart,
  FileText,
  Settings,
  CalendarDays,
} from 'lucide-react'

export default async function HomePage() {
  // We no longer redirect logged-in users away; landing page should be viewable even when authenticated.
  // (Session retrieved only if future personalization needed.)
  await getServerSession(authOptions)

  const features = [
    {
      icon: Users,
      title: 'Üye Yönetimi',
      description: 'Kapsamlı arama, toplu işlemler, etiket ve gruplar.',
    },
    {
      icon: CreditCard,
      title: 'Aidat ve Tahsilat',
      description: 'Esnek dönemler, otomatik borçlandırma ve raporlar.',
    },
    {
      icon: PieChart,
      title: 'Gelir/Gider',
      description: 'Kasa, banka, kategori bazlı izleme ve özet panolar.',
    },
    {
      icon: CalendarDays,
      title: 'Toplantılar',
      description: 'Gündem, yoklama, karar ve imza süreçleri.',
    },
    {
      icon: FileText,
      title: 'Şablonlar',
      description: 'Word/Docx çıktı, e‑posta ve PDF şablon desteği.',
    },
    {
      icon: Settings,
      title: 'Yetkilendirme',
      description: 'Rol bazlı erişim, çoklu dernek ve organizasyonlar.',
    },
  ]

  return (
    <main className="space-y-10">
      <Reveal>
        <Hero />
      </Reveal>

      <section className="rounded-2xl border p-6">
        <Reveal>
          <h2 className="text-xl font-semibold tracking-tight">
            Öne Çıkan Özellikler
          </h2>
        </Reveal>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <FeatureCard
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
