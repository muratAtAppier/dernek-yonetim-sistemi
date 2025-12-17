'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Download } from 'lucide-react'
import { downloadServerPdf } from '@/lib/serverPdf'

interface DenetimKuruluData {
  reportDate: string
  period: string
  startDate: string
  endDate: string
  chairman: string
  members: string[]
  giris: string
  defterInceleme: string[]
  gelirleriIncelenmesi: string[]
  yillikMaliDurum: string[]
  sonucOneri: string[]
  closingText: string
}

interface Props {
  initialData?: Partial<DenetimKuruluData>
  orgName: string
  chairman: string
  members: string[]
}

export function DenetimKuruluRaporuEditor({
  initialData,
  orgName,
  chairman,
  members,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<DenetimKuruluData>({
    reportDate: initialData?.reportDate || '14.12.2025',
    period: initialData?.period || '2022 – 2025',
    startDate: initialData?.startDate || '2022',
    endDate: initialData?.endDate || '2025',
    chairman: initialData?.chairman || chairman || 'Mahmut Cahit Öztürk',
    members: initialData?.members ||
      members.map((m) => m) || ['Nusret Ulusal', 'Tacettin Aydemir'],
    giris:
      initialData?.giris ||
      'Dernek tüzüğü gereği 3 yılda bir yapılan genel kurul toplantısı öncesinde Denetim Kurulu olarak; 2022–2025 yıllarındaki faaliyetler, defterler, gelir-gider belgeleri, banka hareketleri ve mali tablolar incelenmiştir.',
    defterInceleme: initialData?.defterInceleme || [
      'Karar defteri, gelir–gider defteri ve diğer resmi defterlerin düzenli şekilde kaydedildiği,',
      'Tüm gelir ve gider belgelerinin sıra numarası, imzalı, asılı ve mevzuata uygun olduğu,',
      'Banka hesap hareketleri ile dernek kayıtlarının uyumlu olduğu tespit edilmiştir.',
    ],
    gelirleriIncelenmesi: initialData?.gelirleriIncelenmesi || [
      'Gelirlerin kontrolü',
      'Giderlerin değerlendirilmesi',
      '3 yıllık mali durum özeti',
    ],
    yillikMaliDurum: initialData?.yillikMaliDurum || [
      'Sonuç ve Öneriler',
      'Denetim Kurulu üye imzaları',
    ],
    sonucOneri: initialData?.sonucOneri || [
      'Yönetim Kurulu, dernek amaç ve tüzüğüne uygun hareket etmiştir.',
      'Mali tablolar düzenli tutulmuş ve herhangi bir usulsüzlük tespit edilmemiştir.',
      'Genel Kurul tarafından ibra edilmesi tavsiye edilir.',
    ],
    closingText:
      initialData?.closingText ||
      "Derneğimizin mali işlemleri ve idari faaliyetleri denetlenerek, Genel Kurul'un bilgisine sunulmak üzere işbu rapor hazırlanmıştır.",
  })

  const updateField = (field: keyof DenetimKuruluData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const addArrayItem = (field: keyof DenetimKuruluData) => {
    const current = data[field] as string[]
    setData((prev) => ({ ...prev, [field]: [...current, ''] }))
  }

  const removeArrayItem = (field: keyof DenetimKuruluData, index: number) => {
    const current = data[field] as string[]
    setData((prev) => ({
      ...prev,
      [field]: current.filter((_, i) => i !== index),
    }))
  }

  const updateArrayItem = (
    field: keyof DenetimKuruluData,
    index: number,
    value: string
  ) => {
    const current = data[field] as string[]
    const updated = [...current]
    updated[index] = value
    setData((prev) => ({ ...prev, [field]: updated }))
  }

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return

    try {
      const pdfGen = new TurkishPDFGenerator()
      pdfGen.setElement(previewRef.current)
      await pdfGen.generatePDF(`denetim-kurulu-raporu-${data.period}.pdf`)
    } catch (error) {
      console.error('PDF oluşturma hatası:', error)
      alert('PDF oluşturulurken bir hata oluştu.')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="2022-2025"
              />
            </div>
          </div>

          <div>
            <Label>Denetim Kurulu Başkanı</Label>
            <Input
              value={data.chairman}
              onChange={(e) => updateField('chairman', e.target.value)}
              placeholder="Başkan adı"
            />
          </div>

          <div>
            <Label>Denetim Kurulu Üyeleri</Label>
            {data.members.map((member, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={member}
                  onChange={(e) =>
                    updateArrayItem('members', index, e.target.value)
                  }
                  placeholder="Üye adı"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem('members', index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('members')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Üye Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>1. Giriş</Label>
            <Textarea
              value={data.giris}
              onChange={(e) => updateField('giris', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">2. Defter ve Belgelerin İncelenmesi</h3>
          {data.defterInceleme.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                value={item}
                onChange={(e) =>
                  updateArrayItem('defterInceleme', index, e.target.value)
                }
                rows={2}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('defterInceleme', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('defterInceleme')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Madde Ekle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">3. Gelirlerin İncelenmesi</h3>
          {data.gelirleriIncelenmesi.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                value={item}
                onChange={(e) =>
                  updateArrayItem('gelirleriIncelenmesi', index, e.target.value)
                }
                rows={2}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('gelirleriIncelenmesi', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('gelirleriIncelenmesi')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Madde Ekle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Sonuç ve Öneriler</h3>
          {data.sonucOneri.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                value={item}
                onChange={(e) =>
                  updateArrayItem('sonucOneri', index, e.target.value)
                }
                rows={2}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('sonucOneri', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('sonucOneri')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Madde Ekle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Kapanış Metni</Label>
            <Textarea
              value={data.closingText}
              onChange={(e) => updateField('closingText', e.target.value)}
              rows={2}
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
                  `denetim-kurulu-raporu-${data.reportDate}.pdf`,
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
              <h3 className="text-lg font-semibold">DENETİM KURULU RAPORU</h3>
              <p className="text-sm text-muted-foreground mt-2">
                (Genel Kurul: {data.reportDate} - Saat 14.00)
              </p>
            </div>

            <div className="space-y-4 text-base leading-relaxed">
              <div>
                <p className="font-semibold">
                  Kapsanan Dönem: {data.period} (3 Yıllık Faaliyet ve Mali
                  Dönem)
                </p>
                <p className="mt-2">Denetim Kurulu Başkanı: {data.chairman}</p>
                <p className="mt-1">
                  Denetim Kurulu Üyeleri: {data.members.join(', ')}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">1. Giriş</h4>
                <p className="text-xs leading-relaxed">{data.giris}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">
                  2. Defter ve Belgelerin İncelenmesi
                </h4>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {data.defterInceleme.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">
                  3. Gelirlerin İncelenmesi
                </h4>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {data.gelirleriIncelenmesi.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Sonuç ve Öneriler</h4>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {data.sonucOneri.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-xs leading-relaxed mb-4">
                  {data.closingText}
                </p>
                <div className="text-right mt-6">
                  <p className="text-xs mb-1">Saygılarımızla,</p>
                  <p className="font-semibold">{data.chairman}</p>
                  <p className="text-xs text-muted-foreground">
                    Denetim Kurulu Başkanı
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
