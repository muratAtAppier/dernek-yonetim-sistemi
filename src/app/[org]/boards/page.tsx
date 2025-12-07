import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { BoardsClient } from '@/app/[org]/boards/BoardsClient'
import { LinkButton } from '@/components/ui/link-button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { prisma } from '@/lib/prisma'

export default async function BoardsPage(props: any) {
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

  async function getBoards() {
    try {
      const org = await prisma.organization.findUnique({
        where: { slug: params.org },
        select: { id: true },
      })

      if (!org) return []

      const boards = await prisma.board.findMany({
        where: { organizationId: org.id },
        orderBy: [{ type: 'asc' }],
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
              isActive: true,
              startDate: true,
              endDate: true,
              members: {
                select: {
                  memberType: true,
                  role: true,
                  member: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      })

      // Convert dates to strings for client component
      return boards.map((board) => ({
        id: board.id,
        type: board.type,
        name: board.name,
        description: board.description,
        terms: board.terms.map((term) => ({
          id: term.id,
          name: term.name,
          isActive: term.isActive,
          startDate: term.startDate.toISOString(),
          endDate: term.endDate?.toISOString() || null,
          members: term.members.map((m) => ({
            memberType: m.memberType,
            role: m.role,
            member: {
              id: m.member.id,
              firstName: m.member.firstName,
              lastName: m.member.lastName,
            },
          })),
        })),
      }))
    } catch (error) {
      console.error('Error fetching boards:', error)
      return []
    }
  }

  const [role, boards] = await Promise.all([getUserRole(), getBoards()])
  const canWrite = role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF'

  return (
    <main>
      <Breadcrumbs
        items={[{ label: 'Kurullar', href: `/${params.org}/boards` }]}
      />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          Kurullar
        </h1>
        <div className="flex items-center gap-2">
          <LinkButton
            href={`/${params.org}/members`}
            size="sm"
            variant="outline"
          >
            Üyelere Dön
          </LinkButton>
        </div>
      </div>
      <BoardsClient
        org={params.org}
        canWrite={canWrite}
        initialItems={boards}
      />
    </main>
  )
}
