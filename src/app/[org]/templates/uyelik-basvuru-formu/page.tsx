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

export default async function UyelikBasvuruFormuPage({
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
            Üyelik Başvuru Formu
          </h1>
          <p className="text-sm text-muted-foreground">
            Yeni üyelerin dolduracağı başvuru formu
          </p>
        </div>
        <Link href={`/api/${params.org}/documents/uyelik-basvuru-formu/pdf`}>
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
            <CardDescription>Form bu şekilde görünecektir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-white dark:bg-gray-900 min-h-[600px]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">
                  {org?.name || 'DERNEK ADI'}
                </h2>
                <h3 className="text-lg font-semibold">ÜYELİK BAŞVURU FORMU</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">1. KİŞİSEL BİLGİLER</h4>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32">Adı Soyadı:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="flex">
                      <span className="w-32">T.C. Kimlik No:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="flex">
                      <span className="w-32">Doğum Tarihi:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="flex">
                      <span className="w-32">Telefon (GSM):</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="flex">
                      <span className="w-32">E.Post:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="space-y-1">
                      <span>Adres:</span>
                      <div className="border-b border-dotted"></div>
                      <div className="border-b border-dotted"></div>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">2. BEYAN</h4>
                  <p className="text-xs leading-relaxed">
                    {org?.name} derneğinin tüzüğünü okuduğum, kabul ettiğim ve
                    bu dernek amaçları doğrultusunda çalışmayı kabul ve taahhüt
                    ederim.
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">
                    3. BAŞVURU SAHİBİNİN ADI SOYADI
                  </h4>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-20">İmza:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                    <div className="flex">
                      <span className="w-20">Tarih:</span>
                      <span className="flex-1 border-b border-dotted"></span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="font-semibold mb-3">
                    5. YÖNETİM KURULU KARARI
                  </h4>
                  <div className="space-y-2">
                    <p className="text-xs">
                      Başvuru sahibinin üyeliği yönetim kurulu tarafından:
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-current"></span>
                        <span>KABUL EDİLDİ</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-current"></span>
                        <span>REDDEDİLDİ</span>
                      </label>
                    </div>
                    <div className="space-y-1 mt-4">
                      <div className="flex">
                        <span className="w-32">Karar Tarihi:</span>
                        <span className="flex-1 border-b border-dotted"></span>
                      </div>
                      <div className="flex">
                        <span className="w-32">Karar No:</span>
                        <span className="flex-1 border-b border-dotted"></span>
                      </div>
                      <div className="space-y-1 mt-4">
                        <span className="text-xs">Yönetim Kurulu Başkanı:</span>
                        <div className="border-b border-dotted"></div>
                        <span className="text-xs">(İmza)</span>
                      </div>
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
                <h4 className="font-semibold mb-2">Form Hakkında</h4>
                <p className="text-sm text-muted-foreground">
                  Bu form, derneğinize yeni üye olmak isteyen kişiler tarafından
                  doldurulur. Form, başvuru sahibinin kişisel bilgilerini ve
                  dernek tüzüğünü kabul ettiğine dair beyanını içerir.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Form İçeriği</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Kişisel bilgiler (Ad, Soyad, TC No, vb.)</li>
                  <li>İletişim bilgileri</li>
                  <li>Tüzük kabul beyanı</li>
                  <li>Başvuru sahibi imzası</li>
                  <li>Yönetim kurulu karar bölümü</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Kullanım</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  PDF İndir butonuna tıklayarak formu indirebilir, yazdırabilir
                  ve yeni üye adaylarına verebilirsiniz. Doldurulmuş formlar
                  yönetim kurulu toplantısında değerlendirilir.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
