declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'p' | 'portrait' | 'l' | 'landscape'
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | number[]
    compress?: boolean
    precision?: number
    userUnit?: number
  }

  export class jsPDF {
    constructor(options?: jsPDFOptions)
    constructor(
      orientation?: 'p' | 'portrait' | 'l' | 'landscape',
      unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc',
      format?: string | number[]
    )

    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF

    addPage(
      format?: string | number[],
      orientation?: 'p' | 'portrait' | 'l' | 'landscape'
    ): jsPDF

    save(filename: string): jsPDF
  }

  export default jsPDF
}
