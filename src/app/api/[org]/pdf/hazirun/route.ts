import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../../../lib/authz'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const take = Math.min(Number(url.searchParams.get('take') || '200'), 1000)
  const members = await prisma.member.findMany({
    where: { organizationId: access.org.id },
    orderBy: { lastName: 'asc' },
    take,
  })

  const rows = members
    .map(
      (m, i) =>
        `<tr><td>${i + 1}</td><td>${m.firstName} ${m.lastName}</td><td>${m.nationalId ?? ''}</td><td>${m.phone ?? ''}</td><td></td></tr>`
    ) // signature empty column
    .join('')

  const html = `<!doctype html>
  <html><head><meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    h1 { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #444; padding: 6px; }
    th { background: #f0f0f0; }
  </style>
  </head><body>
    <h1>Hazirun Listesi</h1>
    <table>
      <thead><tr><th>#</th><th>Ad Soyad</th><th>TC</th><th>Telefon</th><th>İmza</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`

  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' },
    })
    // Create a Blob from the bytes to satisfy BodyInit cleanly
    const bytes = new Uint8Array(pdf)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="hazirun-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } finally {
    await browser.close()
  }
}
