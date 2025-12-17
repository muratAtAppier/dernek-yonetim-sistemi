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

interface YearActivity {
  year: string
  activities: string[]
}

interface FaaliyetRaporuData {
  reportDate: string
  period: string
  presidentName: string
  yearActivities: YearActivity[]
  closingText: string
}

interface Props {
  initialData?: Partial<FaaliyetRaporuData>
  orgName: string
  presidentName: string
}

export function FaaliyetRaporuEditor({
  initialData,
  orgName,
  presidentName,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<FaaliyetRaporuData>({
    reportDate: initialData?.reportDate || '14.12.2025',
    period: initialData?.period || '2023–2025',
    presidentName: initialData?.presidentName || presidentName,
    yearActivities: initialData?.yearActivities || [
      {
        year: '2023',
        activities: [
          'Cami içi temizlik ve düzenli bakım çalışmaları yapıldı.',
          'Elektrik tesisatının kontrolü ve küçük çaplı tamirleri gerçekleştirildi.',
          'Caminin halıları yıkatıldı ve bazı bölümler yenilendi.',
          'Ramazan ayı boyunca teravih ve mukabele programlarına destek sağlandı.',
          'İhtiyaç sahibi ailelere erzak yardımı yapıldı.',
        ],
      },
      {
        year: '2024',
        activities: [
          'Cami çevresindeki aydınlatma sistemi yenilendi.',
          'Ses sistemi kontrol edilerek hoparlörlerde bakım yapıldı.',
          'Kuran Kursu sınıfında boya–badana ve tadilat işleri yapıldı.',
          "Yaz Kur'an kursu için eğitim materyalleri temin edildi.",
          'Bağış kutuları düzenli şekilde açılarak kayıt altına alındı.',
        ],
      },
      {
        year: '2025',
        activities: [
          'Cami avlusunda çevre düzenlemesi ve parke taş tamiri yapıldı.',
          'Elektrik osvatları ayırlandı ve giderler düzenlendi.',
          'Çok bakım çalışmaları yapıldı.',
          'Temizlik ve lürtasiye malzemeleri alındı.',
          'Ramazan ve Kurban dönemlerinde yardım organizasyonları yapıldı.',
          'Dernek kayıtları ve banka hesapları güncellendi.',
        ],
      },
    ],
    closingText:
      initialData?.closingText ||
      'Derneğimiz, sözkonusu faaliyet döneminde tüzük ve amaçlarına uygun şekilde yönetilmiş, şeffaflık ilkesinden taviz verilmemiştir. Önümüzdeki dönemde de dernekte çalışmalarımız sürecektir.',
  })

  const updateField = (field: keyof FaaliyetRaporuData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const addYear = () => {
    const newYear: YearActivity = {
      year: '',
      activities: [''],
    }
    setData((prev) => ({
      ...prev,
      yearActivities: [...prev.yearActivities, newYear],
    }))
  }

  const removeYear = (index: number) => {
    setData((prev) => ({
      ...prev,
      yearActivities: prev.yearActivities.filter((_, i) => i !== index),
    }))
  }

  const updateYear = (index: number, year: string) => {
    const updated = [...data.yearActivities]
    updated[index].year = year
    setData((prev) => ({ ...prev, yearActivities: updated }))
  }

  const addActivity = (yearIndex: number) => {
    const updated = [...data.yearActivities]
    updated[yearIndex].activities.push('')
    setData((prev) => ({ ...prev, yearActivities: updated }))
  }

  const removeActivity = (yearIndex: number, activityIndex: number) => {
    const updated = [...data.yearActivities]
    updated[yearIndex].activities = updated[yearIndex].activities.filter(
      (_, i) => i !== activityIndex
    )
    setData((prev) => ({ ...prev, yearActivities: updated }))
  }

  const updateActivity = (
    yearIndex: number,
    activityIndex: number,
    value: string
  ) => {
    const updated = [...data.yearActivities]
    updated[yearIndex].activities[activityIndex] = value
    setData((prev) => ({ ...prev, yearActivities: updated }))
  }

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return

    try {
      const pdfGen = new TurkishPDFGenerator()
      pdfGen.setElement(previewRef.current)
      await pdfGen.generatePDF(`faaliyet-raporu-${data.period}.pdf`)
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

      {data.yearActivities.map((yearActivity, yearIndex) => (
        <Card key={yearIndex}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Label className="whitespace-nowrap">Yıl:</Label>
                <Input
                  value={yearActivity.year}
                  onChange={(e) => updateYear(yearIndex, e.target.value)}
                  placeholder="2023"
                  className="w-32"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeYear(yearIndex)}
              >
                <X className="w-4 h-4 mr-2" />
                Yılı Sil
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{yearActivity.year} Yılı Faaliyetleri</Label>
              {yearActivity.activities.map((activity, activityIndex) => (
                <div key={activityIndex} className="flex gap-2">
                  <Textarea
                    value={activity}
                    onChange={(e) =>
                      updateActivity(yearIndex, activityIndex, e.target.value)
                    }
                    placeholder="Faaliyet açıklaması"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(yearIndex, activityIndex)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addActivity(yearIndex)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Faaliyet Ekle
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addYear}>
        <Plus className="w-4 h-4 mr-2" />
        Yıl Ekle
      </Button>

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
                  `faaliyet-raporu-${data.period}.pdf`,
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
                {data.yearActivities.length} YILLIK FAALİYET RAPORU (
                {data.period})
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sunulacağı Tarih: {data.reportDate}
              </p>
              <p className="text-sm mt-1">Başkan: {data.presidentName}</p>
            </div>

            <div className="space-y-3 text-base leading-relaxed">
              {data.yearActivities.map((yearActivity, index) => (
                <div key={index} className="border-t pt-3">
                  <h4 className="font-semibold mb-2">
                    {yearActivity.year} Yılı Faaliyetleri
                  </h4>
                  <ul className="space-y-1 list-disc list-inside">
                    {yearActivity.activities.map((activity, actIndex) => (
                      <li key={actIndex}>{activity}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Düzenleme</h4>
                <p className="text-xs leading-relaxed">{data.closingText}</p>
              </div>

              <div className="border-t pt-4 mt-6">
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
