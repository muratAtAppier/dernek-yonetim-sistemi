import Link from 'next/link'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted-foreground">
      <ol className="flex items-center gap-1">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? 'text-foreground' : undefined}>{c.label}</span>
              )}
              {!last && <span className="opacity-40">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
