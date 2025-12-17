import { NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'

export const runtime = 'nodejs'

type Payload = {
  html?: string
  url?: string
  filename?: string
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
  if (!payload?.html && !payload?.url) {
    return NextResponse.json(
      { error: 'Provide either html or url' },
      { status: 400 }
    )
  }

  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    })

    const page = await context.newPage()

    // If navigating to a URL, set cookies before navigation
    if (payload.url) {
      const cookieHeader = req.headers.get('cookie')
      if (cookieHeader) {
        const target = new URL(payload.url)
        const cookiePairs = cookieHeader.split(';').map((c) => c.trim())
        const validCookies = []

        for (const pair of cookiePairs) {
          const eqIndex = pair.indexOf('=')
          if (eqIndex > 0) {
            const name = pair.substring(0, eqIndex).trim()
            const value = pair.substring(eqIndex + 1).trim()
            if (name && value) {
              validCookies.push({
                name,
                value,
                domain: target.hostname,
                path: '/',
                sameSite: 'Lax' as const,
              })
            }
          }
        }

        if (validCookies.length > 0) {
          try {
            await context.addCookies(validCookies)
          } catch (err) {
            console.warn(
              'Failed to add cookies, proceeding without session:',
              err
            )
          }
        }
      }
    }

    if (payload.url) {
      await page.goto(payload.url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      // In Next.js dev, networkidle may not settle due to HMR; try briefly then proceed
      await page
        .waitForLoadState('networkidle', { timeout: 2000 })
        .catch(() => {})
    } else if (payload.html) {
      await page.setContent(payload.html!, { waitUntil: 'domcontentloaded' })
      await page
        .waitForLoadState('networkidle', { timeout: 2000 })
        .catch(() => {})
    }
    // Small delay to ensure fonts/styles render before printing
    await page.waitForTimeout(200)

    // Apply print CSS
    await page.emulateMedia({ media: 'print' })

    const pdfBuffer = await page.pdf({
      format: payload.pdf?.format ?? 'A4',
      landscape: payload.pdf?.landscape ?? false,
      printBackground: payload.pdf?.printBackground ?? true,
      margin: payload.pdf?.margin ?? {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })
    // Use a Uint8Array (ArrayBufferView) which is a valid BodyInit
    const body = new Uint8Array(pdfBuffer)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${payload.filename ?? `document-${new Date().toISOString().slice(0, 10)}`}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('Playwright PDF error:', err?.message || err)
    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: String(err?.message || err) },
      { status: 500 }
    )
  } finally {
    await browser.close()
  }
}
