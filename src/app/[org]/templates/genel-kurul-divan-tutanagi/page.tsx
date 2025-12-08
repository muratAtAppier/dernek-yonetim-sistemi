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

export default async function GenelKurulDivanTutanagiPage({
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
      address: true,
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
            Genel Kurul Divan Tutanağı
          </h1>
          <p className="text-sm text-muted-foreground">
            Genel kurul toplantısı divan tutanağı
          </p>
        </div>
        <Link
          href={`/api/${params.org}/documents/genel-kurul-divan-tutanagi/pdf`}
        >
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
            <CardDescription>Tutanak bu şekilde görünecektir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-white dark:bg-gray-900 min-h-[600px]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">
                  TACETTİN CAMİ ONARMA VE YAŞATMA DERNEĞİ GENEL KURUL
                </h2>
                <h3 className="text-lg font-semibold">DİVAN TUTANAĞI</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p>
                  Tacettin Cami Onarma ve Yaşatma Derneği&apos;nin 14.12.2025
                  Günü saat 14.00 Hacıtepe Mah Mehmet Akif Ersoy Sok.No : 5
                  Hamamönü Camii Dernek Odası Altındağ/Ankara adresinde yapılan
                  olağan Genel Kurul toplantısında sait çoğunluğun olduğu
                  anlaşılıp(tan sonra;(23 Üyeden 23 Üye bulundu) Kurulu Başkanı
                  Hüseyin ULUSAL tarafından açılmıştır. Açılışa müteakiben
                  verilen önerge ile ;
                </p>

                <div className="border-t pt-3">
                  <p className="font-semibold mb-2">
                    Divan Başkanlığına: Mahmut Cahit ÖZTÜRK
                  </p>
                  <p className="mb-1">
                    Katip Üyelikler ise: Nusret ULUSAL ve İsa KÜSMENOĞLU Genel
                    Kurulca oybirliği ile seçildiler. Divan başkanının teşekkür
                    konuşmasından istiklala rargı okunduktan sonra. gelmiş
                    geçmiş tüm şehitler için saygı duruşunda bulunduk gündem
                    genel kurula okundu. Gündem üzerinde bir değişiklik veya
                    ilave önerisi olmasını istediler. Buna göre :
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="font-semibold">1-Açılış ve Yoklama,</p>
                  <p className="font-semibold">
                    2-Divanın Teşekkülü ve Başkanın Saygı duruşu,
                  </p>
                  <p className="font-semibold">
                    3-Yönetim Kurulu Raporunun ve Denetim Kurulu raporunun
                    okunması müzakere ve ibrası,
                  </p>
                  <p className="font-semibold">
                    4-Yeni Yönetim Kurulunun Seçimi Gizli Oy Açık Tasnif)
                  </p>
                  <p className="font-semibold">
                    5-Dilek temenniler ve Kapanış (Adres Oylaması Açık oyla
                    sunuldu ve oybirliği ile kabul edilmiştir.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="mb-2">
                    Yönetim kurulu faaliyet raporu Başkan Hüseyin ULUSAL,
                    Denetim Kurulu raporu ise. divan başkanlığınca okundu.
                    Okunan raporlar üzerinde lehte ve aleyhte söz alan
                    olmadığından yönetim kurulunun ibrası konusu açık oyla
                    sunuldu ve ibra edilmiştir.
                  </p>
                  <p>
                    Yapılan Gizli Oylama Açık tasnif sonucu yeni yönetim kurulu
                    aşağıdaki şekilde teşekkül etmiştir. Buna Göre ;
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="font-semibold mb-1">
                    YÖNETİM KURULU ASIL ÜYELİĞİNE :
                  </p>
                  <div className="ml-4 space-y-0.5">
                    <p>1- Hüseyin ULUSAL</p>
                    <p>2- Muharrem TÜRK</p>
                    <p>3- Aydın HİCYILMAZ</p>
                    <p>4-Ali Rıza ULUSAL</p>
                    <p>5-Hüseyin KARADENİZ</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="font-semibold mb-1">
                    YÖNETİK KURULU YEDEK ÜYELİĞİNE :
                  </p>
                  <div className="ml-4 space-y-0.5">
                    <p>1-İsa KÜSMENOĞLU</p>
                    <p>2-Ahmet SEÇİLMİŞ</p>
                    <p>3-Adem GÜZEY</p>
                    <p>4-Birol GEÇGİN</p>
                    <p>5- Mu lhan DURUOĞLU</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="font-semibold mb-1">
                    DENETLEME KURULU ASIL ÜYELİĞİNE :
                  </p>
                  <div className="ml-4 space-y-0.5">
                    <p>1-Mahmut Cahit ÖZTÜRK</p>
                    <p>2-Tacettin AYDEMİR</p>
                    <p>3-Nusret ULUSAL</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="font-semibold mb-1">
                    DENETLEME KURULU YEDEK ÜYELİĞİNE :
                  </p>
                  <div className="ml-4 space-y-0.5">
                    <p>1-Kürşat ÇAYAN</p>
                    <p>2-Kemal GÜLER</p>
                    <p>3-Yusuf YILDIRIM</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs">
                    Gündemin son maddesi olan dilek ve temennilerde söz alan
                    üyelersoiuçta yeni yönetim kuruluna başarılar diledikten
                    sonra, toplantı aynı gün saat 14.45 de tarafımızca
                    kapatılmıştır İş bu divan tutanağı müsvettesinden imza alına
                    alınmıştır. 14.12.2025 İsa KÜSMENOGLü Katip üye
                  </p>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <p className="text-xs">Nusret ULUSAL</p>
                      <p className="text-xs">Katip Üye</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">Mahmut Cahit ÖZTÜRK</p>
                      <p className="text-xs">Divan Başkanı</p>
                    </div>
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
                <h4 className="font-semibold mb-2">Tutanak Hakkında</h4>
                <p className="text-sm text-muted-foreground">
                  Genel Kurul Divan Tutanağı, genel kurul toplantısının resmi
                  kaydıdır. Toplantının nasıl geçtiğini, alınan kararları ve
                  seçilen yöneticileri belgeler.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">İçerik</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Toplantı tarihi, saati ve yeri</li>
                  <li>Katılım durumu ve yoklama</li>
                  <li>Divan başkanı ve katip seçimi</li>
                  <li>Gündem maddeleri</li>
                  <li>Yapılan oylamalar</li>
                  <li>Yönetim ve Denetim Kurulu seçimleri</li>
                  <li>Yeni kurul üyeleri listesi</li>
                  <li>Divan başkanı ve katip imzaları</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Kullanım</h4>
                <p className="text-sm text-muted-foreground">
                  Bu tutanak genel kurul toplantısı sırasında tutulur ve
                  toplantı sonunda imzalanır. PDF olarak indirip yazdırabilir
                  veya dijital olarak saklayabilirsiniz.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base text-blue-600 dark:text-blue-400">
                Not
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Görüntülenen tutanak örnek bir belgedir. Gerçek tutanağınız için
                toplantı detaylarını ve seçim sonuçlarını güncellemeniz gerekir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
