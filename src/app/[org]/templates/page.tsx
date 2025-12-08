import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSession } from '../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../lib/authz'
import {
  FileText,
  FileCheck,
  FileBarChart,
  Gavel,
  DollarSign,
  ClipboardList,
} from 'lucide-react'

const documentTypes = [
  {
    id: 'uyelik-belgesi',
    name: 'Üyelik Belgesi',
    description: '',
    icon: FileCheck,
    generateUrl: (org: string) => `/api/${org}/documents/uyelik-belgesi`,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    id: 'uyelik-basvuru-formu',
    name: 'Üyelik Başvuru Formu',
    description: '',
    icon: FileText,
    generateUrl: (org: string) => `/api/${org}/documents/uyelik-basvuru-formu`,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  {
    id: 'denetim-kurulu-raporu',
    name: 'Denetim Kurulu Raporu',
    description: '',
    icon: ClipboardList,
    generateUrl: (org: string) => `/api/${org}/documents/denetim-kurulu-raporu`,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    id: 'genel-kurul-divan-tutanagi',
    name: 'Genel Kurul Divan Tutanağı',
    description: '',
    icon: Gavel,
    generateUrl: (org: string) =>
      `/api/${org}/documents/genel-kurul-divan-tutanagi`,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  {
    id: 'mali-rapor',
    name: 'Mali Rapor',
    description: '',
    icon: DollarSign,
    generateUrl: (org: string) => `/api/${org}/documents/mali-rapor`,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  {
    id: 'faaliyet-raporu',
    name: 'Faaliyet Raporu',
    description: '',
    icon: FileBarChart,
    generateUrl: (org: string) => `/api/${org}/documents/faaliyet-raporu`,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
]

export default async function DocumentsPage({ params: paramsPromise }: any) {
  const params = await paramsPromise
  const session = await getSession()
  if (!session?.user) return <div>Giriş gerekli</div>
  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    params.org
  )
  if (access.notFound) return <div>Dernek bulunamadı</div>
  if (!access.allowed) return <div>Erişim yok</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold leading-none tracking-tight mb-2">
          Dökümanlar
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentTypes.map((doc) => {
          const Icon = doc.icon
          return (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${doc.bgColor} flex items-center justify-center mb-3`}
                >
                  <Icon className={`w-6 h-6 ${doc.color}`} />
                </div>
                <CardTitle className="text-lg">{doc.name}</CardTitle>
                <CardDescription className="text-sm">
                  {doc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${params.org}/templates/${doc.id}`}>
                  <Button variant="outline" className="w-full">
                    Görüntüle / Oluştur
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
