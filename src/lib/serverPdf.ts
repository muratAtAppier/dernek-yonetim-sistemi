export async function downloadServerPdf(
  filename: string,
  element?: HTMLElement | null
) {
  try {
    let htmlContent: string

    if (element) {
      // Collect all stylesheets from the page
      const styleSheets = Array.from(document.styleSheets)
      let allStyles = ''

      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || [])
          rules.forEach((rule) => {
            allStyles += rule.cssText + '\n'
          })
        } catch (e) {
          // Cross-origin stylesheets might fail, skip them
          console.warn('Could not access stylesheet:', e)
        }
      })

      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              ${allStyles}
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `
    } else {
      // Fallback to full page
      htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML
    }

    const payload = { html: htmlContent, filename }
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const ct = res.headers.get('content-type') || ''
      let detail = ''
      try {
        if (ct.includes('application/json')) {
          const j = await res.json()
          detail = j?.detail || j?.error || JSON.stringify(j)
        } else {
          detail = await res.text()
        }
      } catch {}
      throw new Error(`PDF request failed (${res.status}): ${detail}`)
    }
    const blob = await res.blob()
    const dlUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = dlUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(dlUrl)
  } catch (e) {
    console.error('Server PDF download failed:', e)
    alert('PDF oluşturulamadı. Lütfen tekrar deneyin.')
  }
}
