import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { LinkButton } from '@/components/ui/link-button'
import { BoardDetailClient } from '@/app/[org]/boards/[id]/NewBoardDetailClient'
import { prisma } from '@/lib/prisma'

export default async function BoardDetailPage(props: any) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/signin')
  }

  // Get user role directly from database
  async function getUserRole() {
    if (!session?.user?.id) return null

    try {
      const org = await prisma.organization.findUnique({
        where: { slug: params.org },
        select: { id: true },
      })

      if (!org) return null

      const membership = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id as string,
            organizationId: org.id,
          },
        },
        select: { role: true },
      })

      return membership?.role as
        | 'SUPERADMIN'
        | 'ADMIN'
        | 'STAFF'
        | 'MEMBER'
        | null
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  // Get board with active term and members
  async function getBoardData() {
    try {
      const org = await prisma.organization.findUnique({
        where: { slug: params.org },
        select: { id: true },
      })

      if (!org) return null

      const board = await prisma.board.findFirst({
        where: {
          id: params.id,
          organizationId: org.id,
        },
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          terms: {
            where: { isActive: true },
            take: 1,
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              isActive: true,
              members: {
                orderBy: { order: 'asc' },
                select: {
                  role: true,
                  memberType: true,
                  order: true,
                  member: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!board) return null

      return {
        ...board,
        terms: board.terms.map((term) => ({
          ...term,
          startDate: term.startDate.toISOString(),
          endDate: term.endDate?.toISOString() || null,
        })),
      }
    } catch (error) {
      console.error('Error fetching board:', error)
      return null
    }
  }

  const [role, board] = await Promise.all([getUserRole(), getBoardData()])

  if (!board) {
    const { notFound } = await import('next/navigation')
    return notFound()
  }

  const canWrite = role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF'

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: 'Kurullar', href: `/${params.org}/boards` },
          { label: board.name, href: `/${params.org}/boards/${board.id}` },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          {board.name}
        </h1>
        <div className="flex items-center gap-2">
          <LinkButton
            href={`/${params.org}/boards`}
            size="sm"
            variant="outline"
          >
            Kurullara Dön
          </LinkButton>
        </div>
      </div>
      <BoardDetailClient
        org={params.org}
        boardId={board.id}
        boardType={board.type}
        boardName={board.name}
        canWrite={canWrite}
        initialBoard={board}
      />
    </main>
  )
}
