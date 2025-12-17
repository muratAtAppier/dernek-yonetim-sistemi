'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Download } from 'lucide-react'
import { downloadServerPdf } from '@/lib/serverPdf'
import jsPDF from 'jspdf'
import { TurkishPDFGenerator } from '@/lib/pdfGenerator'

interface GenelKurulData {
  meetingDate: string
  meetingTime: string
  meetingLocation: string
  totalMembers: number
  presentMembers: number
  divanBaskan: string
  katipUye1: string
  katipUye2: string
  openingText: string
  agendaItems: string[]
  yonetimAsil: string[]
  yonetimYedek: string[]
  denetimAsil: string[]
  denetimYedek: string[]
  closingText: string
}

interface Props {
  initialData?: Partial<GenelKurulData>
  orgName: string
}

export function GenelKurulDivanEditor({ initialData, orgName }: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<GenelKurulData>({
    meetingDate: initialData?.meetingDate || '14.12.2025',
    meetingTime: initialData?.meetingTime || '14:00',
    meetingLocation:
      initialData?.meetingLocation ||
      'Hacıtepe Mah Mehmet Akif Ersoy Sok.No : 5 Hamamönü Camii Dernek Odası Altındağ/Ankara',
    totalMembers: initialData?.totalMembers || 23,
    presentMembers: initialData?.presentMembers || 23,
    divanBaskan: initialData?.divanBaskan || 'Mahmut Cahit ÖZTÜRK',
    katipUye1: initialData?.katipUye1 || 'Nusret ULUSAL',
    katipUye2: initialData?.katipUye2 || 'İsa KÜSMENOĞLU',
    openingText:
      initialData?.openingText ||
      'Kurulu Başkanı Hüseyin ULUSAL tarafından açılmıştır. Açılışa müteakiben verilen önerge ile Divan Başkanlığına seçildiğim için teşekkür ederim.',
    agendaItems: initialData?.agendaItems || [
      'Açılış ve Yoklama',
      'Divanın Teşekkülü ve Başkanın Saygı duruşu',
      'Yönetim Kurulu Raporunun ve Denetim Kurulu raporunun okunması müzakere ve ibrası',
      'Yeni Yönetim Kurulunun Seçimi (Gizli Oy Açık Tasnif)',
      'Dilek temenniler ve Kapanış (Adres Oylaması Açık oyla sunuldu ve oybirliği ile kabul edilmiştir)',
    ],
    yonetimAsil: initialData?.yonetimAsil || [
      'Hüseyin ULUSAL',
      'Muharrem TÜRK',
      'Aydın HİCYILMAZ',
      'Ali Rıza ULUSAL',
      'Hüseyin KARADENİZ',
    ],
    yonetimYedek: initialData?.yonetimYedek || [
      'İsa KÜSMENOĞLU',
      'Ahmet SEÇİLMİŞ',
      'Adem GÜZEY',
      'Birol GEÇGİN',
      'Mü lhan DURUOĞLU',
    ],
    denetimAsil: initialData?.denetimAsil || [
      'Mahmut Cahit ÖZTÜRK',
      'Tacettin AYDEMİR',
      'Nusret ULUSAL',
    ],
    denetimYedek: initialData?.denetimYedek || [
      'Kürşat ÇAYAN',
      'Kemal GÜLER',
      'Yusuf YILDIRIM',
    ],
    closingText:
      initialData?.closingText ||
      'Gündemin son maddesi olan dilek ve temennilerde söz alan üyeler sonuçta yeni yönetim kuruluna başarılar diledikten sonra, toplantı aynı gün saat 14.45 de tarafımızca kapatılmıştır.',
  })

  const updateField = (field: keyof GenelKurulData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const addArrayItem = (field: keyof GenelKurulData) => {
    const current = data[field] as string[]
    setData((prev) => ({ ...prev, [field]: [...current, ''] }))
  }

  const removeArrayItem = (field: keyof GenelKurulData, index: number) => {
    const current = data[field] as string[]
    setData((prev) => ({
      ...prev,
      [field]: current.filter((_, i) => i !== index),
    }))
  }

  const updateArrayItem = (
    field: keyof GenelKurulData,
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
      await pdfGen.generatePDF(
        `genel-kurul-divan-tutanagi-${data.meetingDate}.pdf`
      )
    } catch (error) {
      console.error('PDF oluşturma hatası:', error)
      alert('PDF oluşturulurken bir hata oluştu.')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Toplantı Tarihi</Label>
              <Input
                type="text"
                value={data.meetingDate}
                onChange={(e) => updateField('meetingDate', e.target.value)}
                placeholder="14.12.2025"
              />
            </div>
            <div>
              <Label>Toplantı Saati</Label>
              <Input
                type="text"
                value={data.meetingTime}
                onChange={(e) => updateField('meetingTime', e.target.value)}
                placeholder="14:00"
              />
            </div>
          </div>

          <div>
            <Label>Toplantı Yeri</Label>
            <Textarea
              value={data.meetingLocation}
              onChange={(e) => updateField('meetingLocation', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Toplam Üye Sayısı</Label>
              <Input
                type="number"
                value={data.totalMembers}
                onChange={(e) =>
                  updateField('totalMembers', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label>Katılan Üye Sayısı</Label>
              <Input
                type="number"
                value={data.presentMembers}
                onChange={(e) =>
                  updateField('presentMembers', parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Divan Üyeleri</h3>
          <div>
            <Label>Divan Başkanı</Label>
            <Input
              value={data.divanBaskan}
              onChange={(e) => updateField('divanBaskan', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Katip Üye 1</Label>
              <Input
                value={data.katipUye1}
                onChange={(e) => updateField('katipUye1', e.target.value)}
              />
            </div>
            <div>
              <Label>Katip Üye 2</Label>
              <Input
                value={data.katipUye2}
                onChange={(e) => updateField('katipUye2', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Gündem Maddeleri</h3>
          {data.agendaItems.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) =>
                  updateArrayItem('agendaItems', index, e.target.value)
                }
                placeholder={`${index + 1}. madde`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('agendaItems', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('agendaItems')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Gündem Maddesi Ekle
          </Button>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Yönetim Kurulu Asil Üyeleri</h3>
          {data.yonetimAsil.map((member, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={member}
                onChange={(e) =>
                  updateArrayItem('yonetimAsil', index, e.target.value)
                }
                placeholder={`${index + 1}. Üye`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('yonetimAsil', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('yonetimAsil')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Üye Ekle
          </Button>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Yönetim Kurulu Yedek Üyeleri</h3>
          {data.yonetimYedek.map((member, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={member}
                onChange={(e) =>
                  updateArrayItem('yonetimYedek', index, e.target.value)
                }
                placeholder={`${index + 1}. Yedek Üye`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('yonetimYedek', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('yonetimYedek')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yedek Üye Ekle
          </Button>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Denetim Kurulu Asil Üyeleri</h3>
          {data.denetimAsil.map((member, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={member}
                onChange={(e) =>
                  updateArrayItem('denetimAsil', index, e.target.value)
                }
                placeholder={`${index + 1}. Üye`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('denetimAsil', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('denetimAsil')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Üye Ekle
          </Button>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Denetim Kurulu Yedek Üyeleri</h3>
          {data.denetimYedek.map((member, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={member}
                onChange={(e) =>
                  updateArrayItem('denetimYedek', index, e.target.value)
                }
                placeholder={`${index + 1}. Yedek Üye`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('denetimYedek', index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('denetimYedek')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yedek Üye Ekle
          </Button>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Önizleme</h3>
            <Button
              size="sm"
              onClick={() =>
                downloadServerPdf(
                  `genel-kurul-divan-tutanagi-${data.meetingDate}.pdf`,
                  previewRef.current
                )
              }
            >
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
          </div>
          <div
            ref={previewRef}
            className="border rounded-lg px-16 py-8 bg-white dark:bg-gray-900 avoid-break"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">
                {orgName.toUpperCase()}
              </h2>
              <h3 className="text-lg font-semibold">
                GENEL KURUL DİVAN TUTANAĞI
              </h3>
            </div>

            <div className="space-y-4 text-base leading-relaxed">
              <p>
                {orgName}&apos;nin {data.meetingDate} Günü saat{' '}
                {data.meetingTime} {data.meetingLocation} adresinde yapılan
                olağan Genel Kurul toplantısında sait çoğunluğun olduğu
                anlaşılıp ({data.totalMembers} Üyeden {data.presentMembers} Üye
                bulundu) {data.openingText}
              </p>

              <div className="border-t pt-3">
                <p className="font-semibold mb-2">
                  Divan Başkanlığına: {data.divanBaskan}
                </p>
                <p>
                  Katip Üyelikler ise: {data.katipUye1} ve {data.katipUye2}{' '}
                  Genel Kurulca oybirliği ile seçildiler.
                </p>
              </div>

              <div className="border-t pt-3">
                {data.agendaItems.map((item, index) => (
                  <p key={index} className="font-semibold">
                    {index + 1}-{item}
                  </p>
                ))}
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold mb-1">
                  YÖNETİM KURULU ASIL ÜYELİĞİNE :
                </p>
                <div className="ml-4 space-y-0.5">
                  {data.yonetimAsil.map((member, index) => (
                    <p key={index}>
                      {index + 1}- {member}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold mb-1">
                  YÖNETİM KURULU YEDEK ÜYELİĞİNE :
                </p>
                <div className="ml-4 space-y-0.5">
                  {data.yonetimYedek.map((member, index) => (
                    <p key={index}>
                      {index + 1}- {member}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold mb-1">
                  DENETLEME KURULU ASIL ÜYELİĞİNE :
                </p>
                <div className="ml-4 space-y-0.5">
                  {data.denetimAsil.map((member, index) => (
                    <p key={index}>
                      {index + 1}- {member}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold mb-1">
                  DENETLEME KURULU YEDEK ÜYELİĞİNE :
                </p>
                <div className="ml-4 space-y-0.5">
                  {data.denetimYedek.map((member, index) => (
                    <p key={index}>
                      {index + 1}- {member}
                    </p>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-xs">{data.closingText}</p>
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-xs">{data.katipUye1}</p>
                    <p className="text-xs">Katip Üye</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">{data.divanBaskan}</p>
                    <p className="text-xs">Divan Başkanı</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
