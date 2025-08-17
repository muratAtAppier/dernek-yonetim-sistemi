import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '../components/providers'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/ThemeToggle'
import { HeaderActions } from '../components/HeaderActions'
// If ThemeToggle exists elsewhere, update the path accordingly, for example:
// import { ThemeToggle } from '../components/ui/ThemeToggle'

export const metadata: Metadata = {
  title: 'Dernek Yönetim Sistemi',
  description: 'Çoklu dernek yönetimi için modern web uygulaması.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Providers>
          <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
              <Link href="/" className="font-semibold tracking-tight">DYS</Link>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <Link href="/org" className="px-2 py-1.5 rounded transition-colors hover:bg-accent hover:text-accent-foreground">Dernekler</Link>
                <HeaderActions />
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-6">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
