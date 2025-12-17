declare module 'jspdf' {
  export class jsPDF {
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

    save(filename: string): jsPDF
  }

  export default jsPDF
}
