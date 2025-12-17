import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../../lib/authz'
import { prisma } from '../../../../lib/prisma'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default async function FaaliyetRaporuPage({
  params: paramsPromise,
}: any) {
  const params = await paramsPromise
  const session = await getSession()
  if (!session?.user) return <div>Giriş gerekli</div>
  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    params.org
  )
  if (access.notFound) return <div>Dernek bulunamadı</div>
  if (!access.allowed) return <div>Erişim yok</div>

  const org = await prisma.organization.findUnique({
    where: { id: access.org.id },
    select: {
      name: true,
    },
  })

  // Get board president
  const president = await prisma.boardMember.findFirst({
    where: {
      term: {
        board: {
          organizationId: access.org.id,
          type: 'EXECUTIVE',
        },
        isActive: true,
      },
      role: 'PRESIDENT',
    },
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${params.org}/templates`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold leading-none tracking-tight mb-1">
            Faaliyet Raporu
          </h1>
        </div>
        <Link href={`/api/${params.org}/documents/faaliyet-raporu/pdf`}>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            PDF İndir
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Önizleme</CardTitle>
            <CardDescription>Rapor bu şekilde görünecektir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-white dark:bg-gray-900 min-h-[700px]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">{org?.name}</h2>
                <h3 className="text-lg font-semibold">
                  3 YILLIK FAALİYET RAPORU (2023–2025)
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Sunulacağı Tarih: 14.12.2025
                </p>
                <p className="text-sm mt-1">
                  Başkan:{' '}
                  {president
                    ? `${president.member.firstName} ${president.member.lastName}`
                    : '[Başkan atanmamış]'}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">2023 Yılı Faaliyetleri</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Cami içi temizlik ve düzenli bakım çalışmaları yapıldı.
                    </li>
                    <li>
                      Elektrik tesisatının kontrolü ve küçük çaplı tamirleri
                      gerçekleştirildi.
                    </li>
                    <li>
                      Caminin halıları yıkatıldı ve bazı bölümler yenilendi.
                    </li>
                    <li>
                      Ramazan ayı boyunca teravih ve mukabele programlarına
                      destek sağlandı.
                    </li>
                    <li>İhtiyaç sahibi ailelere erzak yardımı yapıldı.</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">2024 Yılı Faaliyetleri</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Cami çevresindeki aydınlatma sistemi yenilendi.</li>
                    <li>
                      Ses sistemi kontrol edilerek hoparlörlerde bakım yapıldı.
                    </li>
                    <li>
                      Kuran Kursu sınıfında boya–badana ve tadilat işleri
                      yapıldı.
                    </li>
                    <li>
                      Yaz Kur&apos;an kursu için eğitim materyalleri temin
                      edildi.
                    </li>
                    <li>
                      Bağış kutuları düzenli şekilde açılarak kayıt altına
                      alındı.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">2025 Yılı Faaliyetleri</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Cami avlusunda çevre düzenlemesi ve parke taş tamiri
                      yapıldı.
                    </li>
                    <li>Elektrik saatleri ayrılarak giderler düzenlendi.</li>
                    <li>Çatı bakım çalışmaları yapıldı.</li>
                    <li>Temizlik ve kırtasiye malzemeleri alındı.</li>
                    <li>
                      Ramazan ve Kurban dönemlerinde yardım organizasyonları
                      yapıldı.
                    </li>
                    <li>Dernek kayıtları ve banka hesapları güncellendi.</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">GENEL DEĞERLENDİRME</h4>
                  <p className="leading-relaxed">
                    2023-2025 döneminde derneğimiz, cami bakımı ve ibadethane
                    hizmetlerine yönelik çalışmalarını aksatmadan sürdürmüştür.
                    Yapılan tüm faaliyetler, dernek tüzüğü ve mevzuata uygun
                    şekilde gerçekleştirilmiştir. Cami ve Kuran Kursu
                    ihtiyaçları zamanında karşılanmış, gerekli bakım ve
                    onarımlar yapılmıştır.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">MALİ DURUM</h4>
                  <p className="leading-relaxed">
                    Dönem boyunca gelir-gider dengesi gözetilerek mali disiplin
                    sağlanmıştır. Bağışlar, aidatlar ve diğer gelir kaynakları
                    düzenli olarak kaydedilmiş, harcamalar yönetim kurulu
                    kararları doğrultusunda yapılmıştır. Mali tablolar denetim
                    kurulu tarafından incelenmiş ve uygun bulunmuştur.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">SONUÇ VE ÖNERİLER</h4>
                  <p className="leading-relaxed mb-2">
                    Üç yıllık dönemde derneğimiz amaçları doğrultusunda başarılı
                    çalışmalar gerçekleştirmiştir. Önümüzdeki dönemde;
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Cami fiziki altyapısının güçlendirilmesi,</li>
                    <li>Sosyal sorumluluk projelerinin artırılması,</li>
                    <li>Gençlik ve eğitim programlarının genişletilmesi,</li>
                    <li>
                      Dijital altyapının güçlendirilmesi hedeflenmektedir.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="mb-3 leading-relaxed">
                    Yönetim kurulu olarak tüm üyelerimize, destekçilerimize ve
                    gönüllülerimize teşekkür eder, başarılar dileriz.
                  </p>
                  <div className="text-right">
                    <p className="text-xs mb-1">Saygılarımızla,</p>
                    <p className="font-semibold">
                      {president
                        ? `${president.member.firstName} ${president.member.lastName}`
                        : '[Başkan atanmamış]'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Yönetim Kurulu Başkanı
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tarih: 14.12.2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bilgilendirme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Rapor Hakkında</h4>
                <p className="text-sm text-muted-foreground">
                  Faaliyet Raporu, derneğin 3 yıllık dönemde gerçekleştirdiği
                  tüm çalışmaları, projeleri ve başarıları özetler. Genel kurul
                  toplantısında sunulur.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">İçerik</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>2023, 2024 ve 2025 yılı faaliyetleri</li>
                  <li>Gerçekleştirilen projeler</li>
                  <li>Bakım ve onarım çalışmaları</li>
                  <li>Sosyal sorumluluk projeleri</li>
                  <li>Genel değerlendirme</li>
                  <li>Mali durum özeti</li>
                  <li>Gelecek dönem hedefleri</li>
                  <li>Yönetim Kurulu Başkanı imzası</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Düzenleme</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Görüntülenen rapor örnek bir belgedir. Gerçek faaliyetlerinizi
                  eklemek için raporu indirebilir ve düzenleyebilirsiniz.
                </p>
              </div>
            </CardContent>
          </Card>

          {president && (
            <Card>
              <CardHeader>
                <CardTitle>İmza Yetkisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="mb-2">
                    <span className="font-semibold">
                      Yönetim Kurulu Başkanı:
                    </span>
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {president.member.firstName} {president.member.lastName}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base text-blue-600 dark:text-blue-400">
                İpucu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerçekleştirdiğiniz tüm faaliyetleri kayıt altına alarak yıl
                sonu raporunuzu hazırlamak daha kolay olacaktır. Toplantılar
                bölümünden yapılan toplantıları takip edebilirsiniz.
              </p>
              <Link href={`/${params.org}/meetings`}>
                <Button variant="outline" className="w-full mt-3">
                  Toplantılar Sayfasına Git
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
