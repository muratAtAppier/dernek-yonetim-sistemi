import Link from 'next/link'

export function SortHeader({
  hrefBase,
  current,
  children,
  field,
}: {
  hrefBase: string
  current?: { sort?: string; dir?: 'asc' | 'desc' }
  children: React.ReactNode
  field: string
}) {
  const isActive = current?.sort === field
  const nextDir: 'asc' | 'desc' = isActive && current?.dir === 'asc' ? 'desc' : 'asc'
  const url = `${hrefBase}${hrefBase.includes('?') ? '&' : '?'}sort=${encodeURIComponent(field)}&dir=${nextDir}`
  return (
    <Link href={url} className="inline-flex items-center gap-1 text-sm">
      {children}
      {isActive && <span className="text-xs text-muted-foreground">{current?.dir === 'asc' ? '↑' : '↓'}</span>}
    </Link>
  )
}
