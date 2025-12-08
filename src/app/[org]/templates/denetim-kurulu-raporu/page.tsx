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

export default async function DenetimKuruluRaporuPage({
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

  // Get Denetim Kurulu members
  const denetimKuruluMembers = await prisma.boardMember.findMany({
    where: {
      term: {
        board: {
          organizationId: access.org.id,
          type: 'AUDIT',
        },
        isActive: true,
      },
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
      role: 'asc',
    },
  })

  const chairman = denetimKuruluMembers.find((m) => m.role === 'PRESIDENT')

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
            Denetim Kurulu Raporu
          </h1>
          <p className="text-sm text-muted-foreground">
            Denetim kurulunun yıllık faaliyet raporu
          </p>
        </div>
        <Link href={`/api/${params.org}/documents/denetim-kurulu-raporu/pdf`}>
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
                <h2 className="text-xl font-bold mb-1">
                  {org?.name || 'DERNEK ADI'}
                </h2>
                <h3 className="text-lg font-semibold">DENETİM KURULU RAPORU</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  (Genel Kurul: 14.12.2025 - Saat 14.00)
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">
                    Kapsanan Dönem: 2022 – 2025 (3 Yıllık Faaliyet ve Mali
                    Dönem)
                  </p>
                  <p className="mt-2">
                    Denetim Kurulu Başkanı:{' '}
                    {chairman
                      ? `${chairman.member.firstName} ${chairman.member.lastName}`
                      : 'Mahmut Cahit Öztürk'}
                  </p>
                  <p className="mt-1">
                    Denetim Kurulu Üyeleri:
                    {denetimKuruluMembers.length > 0
                      ? denetimKuruluMembers
                          .filter((m) => m.role !== 'PRESIDENT')
                          .map(
                            (m) => ` ${m.member.firstName} ${m.member.lastName}`
                          )
                          .join(', ')
                      : ' Nusret Ulusal, Tacettin Aydemir'}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">1. Giriş</h4>
                  <p className="text-xs leading-relaxed">
                    Dernek tüzüğü gereği 3 yılda bir yapılan genel kurul
                    toplantısı öncesinde Denetim Kurulu olarak; 2022–2025
                    yıllarındaki faaliyetler, defterler, gelir-gider belgeleri,
                    banka hareketleri ve mali tablolar incelenmemiştir. Yönetim
                    Kurulu&apos;nun, dernek amaç ve tüzüğüne uygun şekilde
                    işleyip yapmadığı değerlendirilmemiştir.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">
                    2. Defter ve Belgelerin İncelenmesi
                  </h4>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>
                      Karar defteri, gelir–gider defteri ve diğer resmi
                      defterlerin düzenli şekilde kaydedildiği,
                    </li>
                    <li>
                      Tüm gelir ve gider belgelerinin sıra numaralı, imzalı,
                      asıllı ve mevzuata uygun olduğu,
                    </li>
                    <li>
                      Banka hesap hareketleri ile dernek kayıtlarının uyumlu
                      olduğu tespit edilmiştir.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">
                    3. Gelirlerin İncelenmesi
                  </h4>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>
                      Bağışlar, yardım makbuzları ve sadaka kutusu gelirlerinin
                      düzenli şekilde kaydedildiği,
                    </li>
                    <li>
                      Sadaka kutularının açılması sırasında düzenlenen
                      tutanakların kayıtlarla uyumlu olduğu,
                    </li>
                    <li>
                      Bankaya yatırılan miktarların makbuzlarla örtüştüğü
                      görülmüştür.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">
                    4. Giderlerin İncelenmesi
                  </h4>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>
                      Cami onarımı, bakım, temizlik, elektrik-su ve diğer
                      giderlere ait belgelerin tam olduğu,
                    </li>
                    <li>
                      Giderlerin Yönetim Kurulu kararları doğrultusunda
                      yapıldığı,
                    </li>
                    <li>
                      Harcamaların dernek tüzüğüne ve amaçlarına uygun olduğu
                      tespit edilmiştir.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">
                    5. 3 Yıllık Mali Durumun Genel Değerlendirmesi
                  </h4>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>
                      Hesap ve kayıt düzeninde herhangi bir usulsüzlüğe
                      rastlanmamış,
                    </li>
                    <li>Belgeler ve harcamalar mevzuata uygun,</li>
                    <li>
                      Dernek faaliyetleri düzenli ve amaçlarına uygun şekilde
                      yürütülmüştür.
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">6. Sonuç ve Teklif</h4>
                  <p className="text-xs leading-relaxed">
                    Yapılan incelemeler sonucunda 2022–2025 faaliyet ve mali
                    işlemlerinde herhangi bir aykırılık tespit edilmemiştir. Bu
                    nedenle Yönetim Kurulu&apos;nun ibra edilmesi Genel
                    Kurul&apos;un takdirine sunulur.
                  </p>
                </div>

                <div className="border-t pt-6 mt-6">
                  <p className="text-xs font-semibold mb-1">
                    Denetim Kurulu Adına
                  </p>
                  <p className="text-sm font-semibold">
                    {chairman
                      ? `${chairman.member.firstName} ${chairman.member.lastName}`
                      : 'Mahmut Cahit Öztürk'}{' '}
                    – Denetim Kurulu Başkanı
                  </p>
                  {denetimKuruluMembers
                    .filter((m) => m.role !== 'PRESIDENT')
                    .map((boardMember, idx) => (
                      <p key={boardMember.memberId} className="text-sm">
                        {boardMember.member.firstName}{' '}
                        {boardMember.member.lastName} – Üye
                      </p>
                    ))}
                  <p className="text-xs text-muted-foreground mt-4">
                    Tarih: 14.12.2025
                  </p>
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
                  Denetim Kurulu Raporu, derneğin mali ve idari işlemlerinin
                  denetlenmesi sonucu hazırlanan resmi bir belgedir. Genel Kurul
                  toplantısında sunulur.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">İçerik</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Defter ve belgelerin incelenmesi</li>
                  <li>Gelirlerin kontrolü</li>
                  <li>Giderlerin değerlendirilmesi</li>
                  <li>3 yıllık mali durum özeti</li>
                  <li>Sonuç ve öneriler</li>
                  <li>Denetim Kurulu üye imzaları</li>
                </ul>
              </div>

              {denetimKuruluMembers.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Denetim Kurulu Üyeleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {denetimKuruluMembers.map((boardMember) => (
                      <div key={boardMember.memberId} className="text-sm py-1">
                        <span className="font-medium">
                          {boardMember.member.firstName}{' '}
                          {boardMember.member.lastName}
                        </span>
                        {boardMember.role === 'PRESIDENT' && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Başkan)
                          </span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <CardTitle className="text-base text-yellow-600 dark:text-yellow-400">
                      Uyarı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Denetim Kurulu üyeleri bulunamadı. Lütfen Kurullar
                      sayfasından Denetim Kurulu üyelerini atayın.
                    </p>
                    <Link href={`/${params.org}/boards`}>
                      <Button variant="outline" className="w-full mt-3">
                        Kurullar Sayfasına Git
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
