'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function OrgNav({ org }: { org: string }) {
  const pathname = usePathname()
  const links = [
    { href: `/${org}/members`, label: 'Üyeler' },
    { href: `/${org}/groups`, label: 'Gruplar' },
  { href: `/${org}/meetings`, label: 'Toplantılar' },
  { href: `/${org}/boards`, label: 'Kurullar' },
    { href: `/${org}/templates`, label: 'Şablonlar' },
  { href: `/${org}/finance`, label: 'Finans' },
  ]
  return (
    <nav className="flex gap-1 rounded-md border bg-card p-1 text-sm">
      {links.map((l) => {
        const active = pathname?.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-sm px-3 py-1.5 transition-colors ${
              active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
