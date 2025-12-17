'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileSpreadsheet, FileText, Users } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useParams } from 'next/navigation'

export default function TumUyelerPage() {
  const params = useParams()
  const org = params.org as string
  const { add } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadMembers = async (format: 'csv' | 'xlsx') => {
    setIsDownloading(true)
    try {
      const response = await fetch(
        `/api/${org}/members/export?format=${format}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body to export all members
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'İndirme başarısız')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tum-uyeler-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      add({
        variant: 'success',
        title: 'İndirme başarılı',
        description: `Tüm üyeler ${format.toUpperCase()} formatında indirildi`,
      })
    } catch (error: any) {
      add({
        variant: 'error',
        title: 'Hata',
        description: error.message || 'İndirme sırasında bir hata oluştu',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
            <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold">Tüm Üyeler</h1>
        </div>
        <p className="text-muted-foreground">
          Derneğinizin tüm üyelerini Excel veya CSV formatında indirin
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>İndirme Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => downloadMembers('xlsx')}
              disabled={isDownloading}
            >
              <div className="flex items-center gap-2 w-full">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Excel (XLSX)</span>
                <Badge variant="secondary" className="ml-auto">
                  Önerilen
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Microsoft Excel ve diğer elektronik tablo programlarıyla uyumlu
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => downloadMembers('csv')}
              disabled={isDownloading}
            >
              <div className="flex items-center gap-2 w-full">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">CSV</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Basit metin formatı, tüm uygulamalarla uyumlu
              </p>
            </Button>
          </div>

          {isDownloading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Download className="w-4 h-4 animate-bounce" />
              <span>İndiriliyor...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İçerik Bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            İndirilen dosya aşağıdaki bilgileri içerir:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Ad</li>
            <li>Soyad</li>
            <li>E-posta</li>
            <li>Telefon</li>
            <li>TC Kimlik No</li>
            <li>Durum (Aktif, Pasif, Ayrıldı)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
