import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../../lib/authz'
import { prisma } from '../../../../lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FormEditor from './FormEditor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Get current board chairman
  const executiveBoard = await prisma.board.findFirst({
    where: {
      organizationId: access.org.id,
      type: 'EXECUTIVE',
    },
    select: {
      id: true,
    },
  })

  let chairmanName: string | null = null
  if (executiveBoard) {
    const currentTerm = await prisma.boardTerm.findFirst({
      where: {
        boardId: executiveBoard.id,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (currentTerm) {
      const chairman = await prisma.boardMember.findFirst({
        where: {
          termId: currentTerm.id,
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
      })

      if (chairman?.member) {
        chairmanName = `${chairman.member.firstName} ${chairman.member.lastName}`
      }
    }
  }

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
        </div>
      </div>

      <FormEditor
        orgName={org?.name || 'DERNEK ADI'}
        orgAddress={org?.address || null}
        chairmanName={chairmanName}
      />
    </div>
  )
}
