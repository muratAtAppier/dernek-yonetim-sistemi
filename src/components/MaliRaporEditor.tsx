'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Download } from 'lucide-react'
import { downloadServerPdf } from '@/lib/serverPdf'
import { TurkishPDFGenerator } from '@/lib/pdfGenerator'

interface FinancialItem {
  description: string
  amount: number
}

interface MaliRaporData {
  reportDate: string
  period: string
  presidentName: string
  gelirler: FinancialItem[]
  giderler: FinancialItem[]
  closingText: string
}

interface Props {
  initialData?: Partial<MaliRaporData>
  orgName: string
  presidentName: string
}

export function MaliRaporEditor({
  initialData,
  orgName,
  presidentName,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<MaliRaporData>({
    reportDate: initialData?.reportDate || '14.12.2025',
    period: initialData?.period || '2023–2025',
    presidentName: initialData?.presidentName || presidentName,
    gelirler: initialData?.gelirler || [
      { description: 'Önceki yıldan devreden bakiye', amount: 252974.51 },
      { description: 'Bağış ve kasa gelirleri', amount: 46602.01 },
      { description: 'Finansal gelir', amount: 109423.49 },
      { description: 'Kira gelirleri', amount: 71000 },
    ],
    giderler: initialData?.giderler || [
      { description: 'Cami ve Kuran Kursu bakım-onarım giderleri', amount: 0 },
      { description: 'Temizlik, elektrik, su ve ısınma giderleri', amount: 0 },
      { description: 'Eğitim faaliyetleri için alınan malzemeler', amount: 0 },
      { description: 'Bağış organizasyonları harcamaları', amount: 0 },
      { description: 'Banka ve muhasebe işlemleri giderleri', amount: 0 },
    ],
    closingText:
      initialData?.closingText ||
      'Yukarıda özetlenen mali rapor, 2023-2025 dönemine ait gelir ve gider kalemlerini içermektedir. Tüm harcamalar dernek tüzüğü ve mevzuata uygun olarak gerçekleştirilmiştir.',
  })

  const updateField = (field: keyof MaliRaporData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const addFinancialItem = (type: 'gelirler' | 'giderler') => {
    const newItem = { description: '', amount: 0 }
    setData((prev) => ({
      ...prev,
      [type]: [...prev[type], newItem],
    }))
  }

  const removeFinancialItem = (
    type: 'gelirler' | 'giderler',
    index: number
  ) => {
    setData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const updateFinancialItem = (
    type: 'gelirler' | 'giderler',
    index: number,
    field: 'description' | 'amount',
    value: string | number
  ) => {
    const items = [...data[type]]
    items[index] = { ...items[index], [field]: value }
    setData((prev) => ({ ...prev, [type]: items }))
  }

  const totalGelir = data.gelirler.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const totalGider = data.giderler.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const balance = totalGelir - totalGider

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return

    try {
      const pdfGen = new TurkishPDFGenerator()
      pdfGen.setElement(previewRef.current)
      await pdfGen.generatePDF(`mali-rapor-${data.period}.pdf`)
    } catch (error) {
      console.error('PDF oluşturma hatası:', error)
      alert('PDF oluşturulurken bir hata oluştu.')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Rapor Tarihi</Label>
              <Input
                type="text"
                value={data.reportDate}
                onChange={(e) => updateField('reportDate', e.target.value)}
                placeholder="14.12.2025"
              />
            </div>
            <div>
              <Label>Dönem</Label>
              <Input
                type="text"
                value={data.period}
                onChange={(e) => updateField('period', e.target.value)}
                placeholder="2023-2025"
              />
            </div>
          </div>

          <div>
            <Label>Başkan Adı</Label>
            <Input
              value={data.presidentName}
              onChange={(e) => updateField('presidentName', e.target.value)}
              placeholder="Başkan adı"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Gelirler</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addFinancialItem('gelirler')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Gelir Kalemi Ekle
            </Button>
          </div>

          {data.gelirler.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateFinancialItem(
                      'gelirler',
                      index,
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Açıklama"
                />
              </div>
              <div className="w-40">
                <Input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) =>
                    updateFinancialItem(
                      'gelirler',
                      index,
                      'amount',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Tutar"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFinancialItem('gelirler', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="border-t pt-3 flex justify-between items-center font-semibold">
            <span>Toplam Gelir:</span>
            <span className="font-mono">{formatCurrency(totalGelir)} TL</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Giderler</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addFinancialItem('giderler')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Gider Kalemi Ekle
            </Button>
          </div>

          {data.giderler.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateFinancialItem(
                      'giderler',
                      index,
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Açıklama"
                />
              </div>
              <div className="w-40">
                <Input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) =>
                    updateFinancialItem(
                      'giderler',
                      index,
                      'amount',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Tutar"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFinancialItem('giderler', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="border-t pt-3 flex justify-between items-center font-semibold">
            <span>Toplam Gider:</span>
            <span className="font-mono">{formatCurrency(totalGider)} TL</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Kapanış Metni</Label>
            <Textarea
              value={data.closingText}
              onChange={(e) => updateField('closingText', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Önizleme</h3>
            <Button
              onClick={() =>
                downloadServerPdf(
                  `mali-rapor-${data.period}.pdf`,
                  previewRef.current
                )
              }
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
          </div>
          <div
            ref={previewRef}
            className="border rounded-lg px-16 py-8 bg-white dark:bg-gray-900"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">{orgName}</h2>
              <h3 className="text-lg font-semibold">
                MALİ RAPOR ({data.period})
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sunulacağı Tarih: {data.reportDate}
              </p>
              <p className="text-sm mt-1">Başkan: {data.presidentName}</p>
            </div>

            <div className="space-y-4 text-base leading-relaxed">
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">GELİRLER</h4>
                <div className="space-y-2 text-base">
                  {data.gelirler.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>- {item.description}:</span>
                      <span className="font-mono">
                        {formatCurrency(item.amount)} TL
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>- Toplam Gelir:</span>
                    <span className="font-mono">
                      {formatCurrency(totalGelir)} TL
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">GİDERLER</h4>
                <div className="space-y-2 text-xs">
                  {data.giderler.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>- {item.description}:</span>
                      <span className="font-mono">
                        {formatCurrency(item.amount)} TL
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold mt-2">
                    <span>- Toplam Gider:</span>
                    <span className="font-mono">
                      {formatCurrency(totalGider)} TL
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">MALİ DURUM ÖZETİ</h4>
                <div className="space-y-1 text-base">
                  <div className="flex justify-between">
                    <span>Toplam Gelir:</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(totalGelir)} TL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Gider:</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(totalGider)} TL
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base">
                    <span>Kalan Bakiye:</span>
                    <span
                      className={`font-mono ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {formatCurrency(balance)} TL
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <p className="text-xs leading-relaxed mb-4">
                  {data.closingText}
                </p>
                <div className="text-right">
                  <p className="text-xs mb-1">Saygılarımızla,</p>
                  <p className="font-semibold">{data.presidentName}</p>
                  <p className="text-xs text-muted-foreground">
                    Yönetim Kurulu Başkanı
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tarih: {data.reportDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
