import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Enable by setting ENABLE_SUBDOMAIN_ROUTING=1
// Optionally set BASE_DOMAIN (e.g., example.com). Defaults to localhost handling.

function getSubdomain(host?: string | null) {
  if (!host) return null
  // strip port
  const h = host.split(':')[0].toLowerCase()
  // nip.io style for local: {sub}.127.0.0.1.nip.io
  if (h.endsWith('.nip.io')) {
    const parts = h.split('.')
    if (parts.length > 5)
      return parts.slice(0, parts.length - 5).join('.') || null
    return null
  }
  // localhost handling: {sub}.localhost
  if (h.endsWith('.localhost')) {
    const sub = h.replace('.localhost', '')
    return sub && sub !== 'www' ? sub : null
  }
  const base = (process.env.BASE_DOMAIN || '').toLowerCase().trim()
  if (base && h.endsWith('.' + base)) {
    const sub = h.slice(0, -1 * (base.length + 1))
    if (!sub) return null
    if (['www', 'app', 'api'].includes(sub)) return null
    return sub
  }
  return null
}

export function middleware(req: NextRequest) {
  if ((process.env.ENABLE_SUBDOMAIN_ROUTING || '0') !== '1')
    return NextResponse.next()

  const { pathname } = req.nextUrl
  // Skip static files and Next internals early
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets')
  )
    return NextResponse.next()

  const host = req.headers.get('host')
  const sub = getSubdomain(host)
  if (!sub) return NextResponse.next()

  // Already namespaced with org slug?
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === sub) return NextResponse.next()

  // API special-casing
  if (segments[0] === 'api') {
    const rootApi = new Set(['auth', 'health', 'pdf', 'mail', 'org'])
    const seg1 = segments[1]
    // If already /api/{org}/..., do nothing
    if (seg1 === sub) return NextResponse.next()
    // If root-level API like /api/auth, don't rewrite
    if (rootApi.has(seg1 || '')) return NextResponse.next()
    const rest = '/' + segments.slice(1).join('/')
    const url = req.nextUrl.clone()
    url.pathname = `/api/${sub}${rest}`
    return NextResponse.rewrite(url)
  }

  // Rewrite app routes to /{org}/...
  const url = req.nextUrl.clone()
  url.pathname = `/${sub}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    // Run for all paths except static files
    '/((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml).*)',
  ],
}
