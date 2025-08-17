import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-10 border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 md:flex-row">
        <p>
          © {new Date().getFullYear()} Dernek Yönetim Sistemi
        </p>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="hover:text-foreground">Giriş</Link>
          <Link href="/org" className="hover:text-foreground">Dernekler</Link>
          <a href="https://webdernek.com" target="_blank" rel="noreferrer" className="hover:text-foreground">Referans</a>
        </div>
      </div>
    </footer>
  )
}
