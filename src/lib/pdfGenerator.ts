import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export class TurkishPDFGenerator {
  private element: HTMLElement | null = null

  setElement(el: HTMLElement) {
    this.element = el
  }

  async generatePDF(filename: string) {
    if (!this.element) {
      throw new Error('No element set for PDF generation')
    }

    // Collect safe break positions (in CSS px relative to container) to avoid slicing text mid-line
    const safeBreaksCssPx: number[] = []
    const pushBreak = (y: number) => {
      const v = Math.round(y)
      if (v > 0) safeBreaksCssPx.push(v)
    }

    // Forced page break markers: break at the top of elements with class 'page-break'
    this.element.querySelectorAll('.page-break').forEach((el) => {
      if (el instanceof HTMLElement) {
        pushBreak(el.offsetTop)
      }
    })

    // Prefer breaking after common block elements
    this.element
      .querySelectorAll(
        'p, li, h1, h2, h3, h4, h5, h6, table, hr, .avoid-break, .section'
      )
      .forEach((el) => {
        if (el instanceof HTMLElement) {
          pushBreak(el.offsetTop + el.offsetHeight)
        }
      })

    // Also include bottoms of immediate children as safe breakpoints
    Array.from(this.element.children).forEach((el) => {
      if (el instanceof HTMLElement) {
        pushBreak(el.offsetTop + el.offsetHeight)
      }
    })

    // Deduplicate and sort
    const uniqueSafeBreaksCssPx = Array.from(new Set(safeBreaksCssPx)).sort(
      (a, b) => a - b
    )

    const canvas = await html2canvas(this.element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    } as any)
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const imgDisplayWidthMm = pageWidth - 2 * margin

    // Calculate px-to-mm conversion based on how we scale the image to fit the PDF content width
    const pxPerMm = canvas.width / imgDisplayWidthMm
    const contentHeightPerPageMm = pageHeight - 2 * margin
    const contentHeightPerPagePx = Math.floor(contentHeightPerPageMm * pxPerMm)

    // Convert safe breaks to canvas pixel coordinates using the actual rendered scale
    const elementScrollHeightCssPx = this.element.scrollHeight
    const scaleFactor = canvas.height / elementScrollHeightCssPx
    const safeBreaksCanvasPx = uniqueSafeBreaksCssPx.map((y) =>
      Math.round(y * scaleFactor)
    )

    let srcY = 0
    let isFirstPage = true

    // Safety padding to ensure we don't cut too close to text lines
    const safetyPaddingPx = Math.round(8 * scaleFactor) // ~8 CSS px
    const minProgressPx = Math.round(40 * scaleFactor) // avoid zero-progress loops
    const scanRangePx = Math.round(150 * scaleFactor) // search window around boundary

    const mainCtx = canvas.getContext('2d')
    if (!mainCtx) {
      throw new Error('Failed to get 2D context for main canvas')
    }

    // Check if a horizontal line is mostly white (no text), using stride sampling to keep it light
    const isLineMostlyWhite = (y: number) => {
      if (y < 0 || y >= canvas.height) return false
      const stride = Math.max(4, Math.floor(canvas.width / 256))
      let whiteCount = 0
      let total = 0
      for (let x = 0; x < canvas.width; x += stride) {
        const pixel = mainCtx.getImageData(x, y, 1, 1).data
        // near-white threshold; allow slight anti-aliasing
        if (pixel[0] > 245 && pixel[1] > 245 && pixel[2] > 245) {
          whiteCount++
        }
        total++
      }
      return whiteCount / total > 0.95
    }

    // Find a whitespace break close to target, scanning downwards first
    const findWhitespaceBreak = (startY: number, endY: number) => {
      const yMax = Math.min(canvas.height - 1, endY)
      const yMin = Math.max(0, startY)
      for (let y = yMax; y >= yMin; y--) {
        if (isLineMostlyWhite(y)) return y
      }
      return -1
    }

    while (srcY < canvas.height) {
      const targetBottomPx = Math.min(
        srcY + contentHeightPerPagePx,
        canvas.height
      )

      // 1) Try DOM-derived safe breaks within window
      let sliceBottomPx = targetBottomPx
      for (let i = safeBreaksCanvasPx.length - 1; i >= 0; i--) {
        const br = safeBreaksCanvasPx[i]
        if (
          br <= targetBottomPx - safetyPaddingPx &&
          br > srcY + minProgressPx
        ) {
          sliceBottomPx = br
          break
        }
      }

      // 2) If no suitable safe break, try whitespace scan around boundary
      if (sliceBottomPx === targetBottomPx) {
        const scanStart = Math.max(
          srcY + minProgressPx,
          targetBottomPx - scanRangePx
        )
        const scanEnd = Math.max(scanStart, targetBottomPx - safetyPaddingPx)
        const whiteY = findWhitespaceBreak(scanStart, scanEnd)
        if (whiteY !== -1) {
          sliceBottomPx = whiteY
        }
      }

      // 3) As a final fallback, if we still don't have progress, pick the nearest earlier safe break even if < minProgress
      if (sliceBottomPx === targetBottomPx) {
        for (let i = safeBreaksCanvasPx.length - 1; i >= 0; i--) {
          const br = safeBreaksCanvasPx[i]
          if (
            br <= targetBottomPx - safetyPaddingPx &&
            br > srcY + Math.round(8 * scaleFactor)
          ) {
            sliceBottomPx = br
            break
          }
        }
      }

      // 4) If absolutely no better option found, use targetBottomPx but trim a few pixels to reduce chance of mid-line cut
      if (sliceBottomPx === targetBottomPx) {
        sliceBottomPx = Math.max(
          srcY + Math.round(20 * scaleFactor),
          targetBottomPx - Math.round(6 * scaleFactor)
        )
      }

      const sliceHeightPx = Math.max(1, sliceBottomPx - srcY)

      // Create an offscreen canvas for the current slice
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get 2D context for slice canvas')
      }
      // Draw the appropriate portion of the main canvas into the slice
      ctx.drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        sliceCanvas.width,
        sliceCanvas.height
      )

      const sliceImgData = sliceCanvas.toDataURL('image/png', 1.0)
      const sliceHeightMm = sliceHeightPx / pxPerMm

      if (!isFirstPage) {
        pdf.addPage()
      }
      pdf.addImage(
        sliceImgData,
        'PNG',
        margin,
        margin,
        imgDisplayWidthMm,
        sliceHeightMm
      )

      isFirstPage = false
      srcY += sliceHeightPx
    }

    pdf.save(filename)
  }
}

// Legacy text-based generator (deprecated - use HTML-based generation instead)
export class TextPDFGenerator {
  private pdf: any
  private pageWidth: number = 210
  private pageHeight: number = 297
  private margin: number = 20
  private yPos: number = 20
  private lineHeight: number = 7

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    }) as any
    this.pdf.setFont('courier', 'normal')
  }

  private checkPageBreak(space: number = 10) {
    if (this.yPos + space > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.yPos = this.margin
    }
  }

  addTitle(text: string, size: number = 16, isBold: boolean = true) {
    this.checkPageBreak(size * 0.5)
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', isBold ? 'bold' : 'normal')
    const textWidth = this.pdf.getTextWidth(text)
    const x = (this.pageWidth - textWidth) / 2
    this.pdf.text(text, x, this.yPos)
    this.yPos += size * 0.5 + 2
  }

  addSubtitle(text: string, size: number = 14, isBold: boolean = true) {
    this.checkPageBreak(size * 0.5)
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', isBold ? 'bold' : 'normal')
    const textWidth = this.pdf.getTextWidth(text)
    const x = (this.pageWidth - textWidth) / 2
    this.pdf.text(text, x, this.yPos)
    this.yPos += size * 0.5 + 1
  }

  addText(
    text: string,
    size: number = 12,
    isBold: boolean = false,
    indent: number = 0,
    align: 'left' | 'center' | 'right' = 'left'
  ) {
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', isBold ? 'bold' : 'normal')

    const maxWidth = this.pageWidth - 2 * this.margin - indent - 5
    const lines = this.pdf.splitTextToSize(text, maxWidth)

    lines.forEach((line: string) => {
      this.checkPageBreak(this.lineHeight)

      let x = this.margin + indent
      if (align === 'center') {
        const textWidth = this.pdf.getTextWidth(line)
        x = (this.pageWidth - textWidth) / 2
      } else if (align === 'right') {
        const textWidth = this.pdf.getTextWidth(line)
        x = this.pageWidth - this.margin - textWidth
      }

      this.pdf.text(line, x, this.yPos)
      this.yPos += this.lineHeight
    })
  }

  addSectionHeader(text: string, size: number = 13) {
    this.checkPageBreak(10)
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', 'bold')
    this.pdf.text(text, this.margin, this.yPos)
    this.yPos += size * 0.5 + 2
  }

  addListItem(text: string, bullet: string = '•', size: number = 12) {
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', 'normal')

    const bulletWidth = 7
    const maxWidth = this.pageWidth - 2 * this.margin - bulletWidth - 5
    const lines = this.pdf.splitTextToSize(text, maxWidth)

    lines.forEach((line: string, index: number) => {
      this.checkPageBreak(this.lineHeight)

      if (index === 0) {
        this.pdf.text(bullet, this.margin, this.yPos)
      }
      this.pdf.text(line, this.margin + bulletWidth, this.yPos)
      this.yPos += this.lineHeight
    })
  }

  addSpace(space: number = 5) {
    this.yPos += space
  }

  addHorizontalLine() {
    this.checkPageBreak(5)
    this.pdf.setLineWidth(0.5)
    this.pdf.line(
      this.margin,
      this.yPos,
      this.pageWidth - this.margin,
      this.yPos
    )
    this.yPos += 3
  }

  addKeyValue(
    key: string,
    value: string,
    size: number = 12,
    keyWidth: number = 60
  ) {
    this.checkPageBreak(this.lineHeight)
    this.pdf.setFontSize(size)
    this.pdf.setFont('courier', 'bold')
    this.pdf.text(key, this.margin, this.yPos)

    this.pdf.setFont('courier', 'normal')
    const maxWidth = this.pageWidth - 2 * this.margin - keyWidth - 5
    const lines = this.pdf.splitTextToSize(value, maxWidth)

    lines.forEach((line: string, index: number) => {
      if (index > 0) {
        this.checkPageBreak(this.lineHeight)
        this.yPos += this.lineHeight
      }
      this.pdf.text(line, this.margin + keyWidth, this.yPos)
    })

    this.yPos += this.lineHeight
  }

  save(filename: string) {
    this.pdf.save(filename)
  }

  getPDF(): jsPDF {
    return this.pdf
  }

  getYPos(): number {
    return this.yPos
  }

  setYPos(y: number) {
    this.yPos = y
  }
}
