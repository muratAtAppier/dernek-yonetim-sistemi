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

export default async function MaliRaporPage({ params: paramsPromise }: any) {
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
            Mali Rapor
          </h1>
          <p className="text-sm text-muted-foreground">
            Derneğin mali dönem raporu
          </p>
        </div>
        <Link href={`/api/${params.org}/documents/mali-rapor/pdf`}>
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
            <div className="border rounded-lg p-8 bg-white dark:bg-gray-900 min-h-[600px]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">{org?.name}</h2>
                <h3 className="text-lg font-semibold">
                  MALİ RAPOR (2023–2025)
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

              <div className="space-y-4 text-sm">
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">GELİRLER</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>- Önceki yıldan devreden bakiye:</span>
                      <span className="font-mono">252,974.51 TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Bağış ve kasa gelirleri:</span>
                      <span className="font-mono">46,602.01 TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Finansal gelir:</span>
                      <span className="font-mono">109,423.49 TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Kira gelirleri:</span>
                      <span className="font-mono">71,000 TL</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>- Toplam Gelir:</span>
                      <span className="font-mono">480,000 TL</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">GİDERLER</h4>
                  <div className="space-y-2 text-xs">
                    <p>- Cami ve Kuran Kursu bakım-onarım giderleri</p>
                    <p>- Temizlik, elektrik, su ve ısınma giderleri</p>
                    <p>- Eğitim faaliyetleri için alınan malzemeler</p>
                    <p>- Bağış organizasyonları harcamaları</p>
                    <p>- Banka ve muhasebe işlemleri giderleri</p>
                    <div className="flex justify-between border-t pt-2 font-semibold mt-2">
                      <span>- Toplam Gider:</span>
                      <span className="font-mono">480,000 TL</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">MALİ DURUM ÖZETİ</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Toplam Gelir:</span>
                      <span className="font-mono font-semibold">
                        480,000 TL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toplam Gider:</span>
                      <span className="font-mono font-semibold">
                        480,000 TL
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-base">
                      <span>Kalan Bakiye:</span>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        0 TL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <p className="text-xs leading-relaxed mb-4">
                    Yukarıda özetlenen mali rapor, 2023-2025 dönemine ait gelir
                    ve gider kalemlerini içermektedir. Tüm harcamalar dernek
                    tüzüğü ve mevzuata uygun olarak gerçekleştirilmiştir.
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
                  Mali Rapor, derneğin belirli bir dönemdeki gelir ve
                  giderlerini özetler. Genel kurul toplantısında üyelere sunulur
                  ve şeffaflık sağlar.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">İçerik</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Gelir kalemleri (bağışlar, kiralar, vb.)</li>
                  <li>Gider kalemleri detaylı</li>
                  <li>Dönem başı ve sonu bakiyeler</li>
                  <li>Mali durum özeti</li>
                  <li>Yönetim Kurulu Başkanı imzası</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Veri Kaynağı</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Raporda gösterilen veriler örnek verilerdir. Gerçek verileri
                  görmek için Finans sayfasını ziyaret edin.
                </p>
                <Link href={`/${params.org}/finance`}>
                  <Button variant="outline" className="w-full">
                    Finans Sayfasına Git
                  </Button>
                </Link>
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
        </div>
      </div>
    </div>
  )
}
