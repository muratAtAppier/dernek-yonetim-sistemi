import { NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'

export const runtime = 'nodejs'

type Payload = {
  html: string
  pdf?: {
    format?: 'A4' | 'A5' | 'Letter' | 'Legal'
    landscape?: boolean
    margin?: { top?: string; right?: string; bottom?: string; left?: string }
    printBackground?: boolean
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: Payload
  try {
    payload = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!payload?.html || typeof payload.html !== 'string') {
    return NextResponse.json({ error: 'html is required' }, { status: 400 })
  }

  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(payload.html, { waitUntil: 'networkidle' })

    const pdfBuffer = await page.pdf({
      format: payload.pdf?.format ?? 'A4',
      landscape: payload.pdf?.landscape ?? false,
      printBackground: payload.pdf?.printBackground ?? true,
      margin: payload.pdf?.margin,
    })
    // Use a Uint8Array (ArrayBufferView) which is a valid BodyInit
    const body = new Uint8Array(pdfBuffer)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } finally {
    await browser.close()
  }
}
