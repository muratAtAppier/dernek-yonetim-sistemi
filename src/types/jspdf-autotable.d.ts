declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  export interface UserOptions {
    head?: any[][]
    body?: any[][]
    foot?: any[][]
    startY?: number
    margin?: { top?: number; right?: number; bottom?: number; left?: number }
    pageBreak?: 'auto' | 'avoid' | 'always'
    tableWidth?: 'auto' | 'wrap' | number
    showHead?: 'everyPage' | 'firstPage' | 'never'
    showFoot?: 'everyPage' | 'lastPage' | 'never'
    theme?: 'striped' | 'grid' | 'plain'
    styles?: any
    headStyles?: any
    bodyStyles?: any
    footStyles?: any
    alternateRowStyles?: any
    columnStyles?: any
    didDrawPage?: (data: any) => void
    didParseCell?: (data: any) => void
    willDrawCell?: (data: any) => void
    didDrawCell?: (data: any) => void
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): jsPDF

  export function applyPlugin(jsPDF: any): void
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: import('jspdf-autotable').UserOptions) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}
