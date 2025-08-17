import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug } from '../../../../../lib/authz'
import * as XLSX from 'xlsx'
import { Prisma } from '@prisma/client'

const BodyIds = z.object({ ids: z.array(z.string().min(1)).min(1) })
const BodyFilter = z.object({
  q: z.string().optional(),
  status: z.enum(['ACTIVE', 'PASSIVE', 'LEFT']).optional(),
  tags: z.array(z.string().min(1)).optional(),
  mode: z.enum(['and', 'or']).optional(),
  groups: z.array(z.string().min(1)).optional(),
  groupsMode: z.enum(['and', 'or']).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(session.user.id as string, org)
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const url = new URL(req.url)
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    const json = await req.json().catch(() => ({}))

    let members: Array<any> = []
    let memberIds: string[] = []

    const parsedIds = BodyIds.safeParse(json)
    if (parsedIds.success) {
      // Export by explicit ids
      memberIds = parsedIds.data.ids
      members = await prisma.member.findMany({
        where: { id: { in: memberIds }, organizationId: access.org.id },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Try filter-based export
      const parsedFilter = BodyFilter.safeParse(json)
      if (!parsedFilter.success) {
        return NextResponse.json(
          {
            error:
              'Geçersiz istek: ids veya filtre (q/status/tags/groups) gönderin.',
          },
          { status: 400 }
        )
      }
      const {
        q,
        status,
        tags = [],
        mode = 'or',
        groups = [],
        groupsMode = 'or',
      } = parsedFilter.data
      const where: any = { organizationId: access.org.id }
      if (q && q.trim()) {
        const qq = q.trim()
        where.OR = [
          { firstName: { contains: qq, mode: 'insensitive' } },
          { lastName: { contains: qq, mode: 'insensitive' } },
          { email: { contains: qq, mode: 'insensitive' } },
          { phone: { contains: qq, mode: 'insensitive' } },
          { nationalId: { contains: qq, mode: 'insensitive' } },
        ]
      }
      if (status && ['ACTIVE', 'PASSIVE', 'LEFT'].includes(status))
        where.status = status
      if (tags.length > 0) {
        if (mode === 'and') {
          where.AND = (where.AND || []).concat(
            tags.map((id) => ({ tags: { some: { tagId: id } } }))
          )
        } else {
          if (tags.length === 1) where.tags = { some: { tagId: tags[0] } }
          else where.tags = { some: { tagId: { in: tags } } }
        }
      }
      if (groups.length > 0) {
        if (groupsMode === 'and') {
          where.AND = (where.AND || []).concat(
            groups.map((id) => ({ groups: { some: { groupId: id } } }))
          )
        } else {
          if (groups.length === 1)
            where.groups = { some: { groupId: groups[0] } }
          else where.groups = { some: { groupId: { in: groups } } }
        }
      }

      // Safety cap
      const MAX = 5000
      const total = await prisma.member.count({ where })
      if (total > MAX) {
        return NextResponse.json(
          {
            error: `Çok fazla kayıt (${total}). Lütfen filtreyi daraltın veya parça parça dışa aktarın. En fazla ${MAX} kayıt dışa aktarılabilir.`,
          },
          { status: 400 }
        )
      }
      members = await prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: total,
      })
      memberIds = members.map((m) => m.id)
    }

    // Load tag names per member
    let tagMap = new Map<string, string[]>()
    let groupMap = new Map<string, string[]>()
    if (memberIds.length) {
      const rows = await prisma.$queryRaw<
        Array<{ memberId: string; name: string }>
      >`
        SELECT mt."memberId" as "memberId", t.name as name
        FROM "MemberTag" mt
        JOIN "Tag" t ON t.id = mt."tagId"
        WHERE mt."memberId" IN (${Prisma.join(memberIds)})
      `
      tagMap = rows.reduce((acc, r) => {
        const arr = acc.get(r.memberId) || []
        arr.push(r.name)
        acc.set(r.memberId, arr)
        return acc
      }, new Map<string, string[]>())

      const gRows = await prisma.$queryRaw<
        Array<{ memberId: string; name: string }>
      >`
        SELECT mg."memberId" as "memberId", g.name as name
        FROM "MemberGroup" mg
        JOIN "Group" g ON g.id = mg."groupId"
        WHERE mg."memberId" IN (${Prisma.join(memberIds)})
      `
      groupMap = gRows.reduce((acc, r) => {
        const arr = acc.get(r.memberId) || []
        arr.push(r.name)
        acc.set(r.memberId, arr)
        return acc
      }, new Map<string, string[]>())
    }

    if (format === 'xlsx' || format === 'excel') {
      const rows = members.map((m) => ({
        Ad: m.firstName,
        Soyad: m.lastName,
        'E-posta': m.email ?? '',
        Telefon: m.phone ?? '',
        TC: m.nationalId ?? '',
        Durum: m.status,
        Etiketler: (tagMap.get(m.id) || []).join('; '),
        Gruplar: (groupMap.get(m.id) || []).join('; '),
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Hazirun')

      // Return ArrayBuffer (BodyInit-compatible) instead of Node Buffer
      const arrayBuffer = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      }) as ArrayBuffer

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="hazirun-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      })
    }

    const header = [
      'Ad',
      'Soyad',
      'E-posta',
      'Telefon',
      'TC',
      'Durum',
      'Etiketler',
      'Gruplar',
    ]
    const rows = members.map((m) => [
      m.firstName,
      m.lastName,
      m.email ?? '',
      m.phone ?? '',
      m.nationalId ?? '',
      m.status,
      (tagMap.get(m.id) || []).join('; '),
      (groupMap.get(m.id) || []).join('; '),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hazirun-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e: any) {
    if (e?.issues)
      return NextResponse.json(
        { error: 'Validation', details: e.issues },
        { status: 400 }
      )
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Ensure Node runtime (xlsx uses Node APIs)
export const runtime = 'nodejs'
