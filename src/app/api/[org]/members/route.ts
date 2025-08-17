import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '../../../../lib/prisma'
import { getSession } from '../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../lib/authz'
import { Prisma } from '@prisma/client'

const CreateMember = z.object({
  firstName: z.string().min(1, 'Ad zorunludur'),
  lastName: z.string().min(1, 'Soyad zorunludur'),
  email: z
    .union([z.string().email('Geçerli e-posta'), z.literal('')])
    .optional(),
  phone: z
    .union([z.string().min(5, 'Telefon çok kısa'), z.literal('')])
    .optional(),
  status: z.enum(['ACTIVE', 'PASSIVE', 'LEFT']).optional(),
  nationalId: z
    .union([
      z.string().regex(/^\d{11}$/, 'TC Kimlik No 11 haneli olmalı'),
      z.literal(''),
    ])
    .optional(),
  address: z
    .union([z.string().min(3, 'Adres çok kısa'), z.literal('')])
    .optional(),
  occupation: z
    .union([z.string().min(2, 'Meslek çok kısa'), z.literal('')])
    .optional(),
  joinedAt: z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return undefined
    if (typeof v === 'string' || v instanceof Date) {
      const d = new Date(v as any)
      return isNaN(d.getTime()) ? undefined : d
    }
    return undefined
  }, z.date().optional()),
})

export async function GET(
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

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const status = url.searchParams.get('status') as
    | 'ACTIVE'
    | 'PASSIVE'
    | 'LEFT'
    | null
  const tagIds = url.searchParams
    .getAll('tag')
    .map((t) => t.trim())
    .filter(Boolean)
  const groupIds = url.searchParams
    .getAll('group')
    .map((t) => t.trim())
    .filter(Boolean)
  const tagsMode = (
    url.searchParams.get('tagsMode') ||
    url.searchParams.get('tagMode') ||
    'or'
  ).toLowerCase() as 'and' | 'or'
  const groupsMode = (
    url.searchParams.get('groupsMode') || 'or'
  ).toLowerCase() as 'and' | 'or'
  const takeParam = Number(url.searchParams.get('take') ?? '50')
  const take = Math.min(Math.max(isNaN(takeParam) ? 50 : takeParam, 1), 200) + 1
  const cursor = url.searchParams.get('cursor') ?? undefined
  const sortRaw = (url.searchParams.get('sort') || '').toString().trim()
  const dirRaw = (url.searchParams.get('dir') || 'desc')
    .toString()
    .toLowerCase() as 'asc' | 'desc'
  const dir: 'asc' | 'desc' = dirRaw === 'asc' ? 'asc' : 'desc'

  const where: any = { organizationId: access.org.id }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { nationalId: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (status && ['ACTIVE', 'PASSIVE', 'LEFT'].includes(status))
    where.status = status

  if (tagIds.length > 0) {
    if (tagsMode === 'and') {
      const andClauses = tagIds.map((id) => ({ tags: { some: { tagId: id } } }))
      if (Array.isArray(where.AND)) where.AND.push(...andClauses)
      else if (where.AND) where.AND = [where.AND, ...andClauses]
      else where.AND = andClauses
    } else {
      // default OR semantics
      if (tagIds.length === 1) where.tags = { some: { tagId: tagIds[0] } }
      else where.tags = { some: { tagId: { in: tagIds } } }
    }
  }

  if (groupIds.length > 0) {
    if (groupsMode === 'and') {
      const andClauses = groupIds.map((id) => ({
        groups: { some: { groupId: id } },
      }))
      if (Array.isArray(where.AND)) where.AND.push(...andClauses)
      else if (where.AND) where.AND = [where.AND, ...andClauses]
      else where.AND = andClauses
    } else {
      if (groupIds.length === 1)
        where.groups = { some: { groupId: groupIds[0] } }
      else where.groups = { some: { groupId: { in: groupIds } } }
    }
  }

  let orderBy: any = [{ createdAt: 'desc' }]
  switch (sortRaw) {
    case 'name':
      orderBy = [{ lastName: dir }, { firstName: dir }]
      break
    case 'firstName':
    case 'lastName':
    case 'createdAt':
    case 'joinedAt':
    case 'status':
      orderBy = [{ [sortRaw]: dir }]
      break
    default:
      orderBy = [{ createdAt: 'desc' }]
  }

  const items = await prisma.member.findMany({
    where,
    orderBy,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
  })

  const hasMore = items.length === take
  const sliced = hasMore ? items.slice(0, take - 1) : items
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id : null

  const ids = sliced.map((m) => m.id)
  let tagMap = new Map<
    string,
    Array<{ id: string; name: string; color: string | null }>
  >()
  let groupMap = new Map<
    string,
    Array<{ id: string; name: string; type: string; color: string | null }>
  >()
  if (ids.length) {
    const rows = await prisma.$queryRaw<
      Array<{
        memberId: string
        id: string
        name: string
        color: string | null
      }>
    >`
      SELECT mt."memberId" as "memberId", t.id, t.name, t.color
      FROM "MemberTag" mt
      JOIN "Tag" t ON t.id = mt."tagId"
      WHERE mt."memberId" IN (${Prisma.join(ids)})
    `
    tagMap = rows.reduce((acc, r) => {
      const arr = acc.get(r.memberId) || []
      arr.push({ id: r.id, name: r.name, color: r.color })
      acc.set(r.memberId, arr)
      return acc
    }, new Map<string, Array<{ id: string; name: string; color: string | null }>>())

    const gRows = await prisma.$queryRaw<
      Array<{
        memberId: string
        id: string
        name: string
        type: string
        color: string | null
      }>
    >`
      SELECT mg."memberId" as "memberId", g.id, g.name, g.type, g.color
      FROM "MemberGroup" mg
      JOIN "Group" g ON g.id = mg."groupId"
      WHERE mg."memberId" IN (${Prisma.join(ids)})
    `
    groupMap = gRows.reduce((acc, r) => {
      const arr = acc.get(r.memberId) || []
      arr.push({ id: r.id, name: r.name, type: r.type, color: r.color })
      acc.set(r.memberId, arr)
      return acc
    }, new Map<string, Array<{ id: string; name: string; type: string; color: string | null }>>())
  }

  const enriched = sliced.map((m) => ({
    ...m,
    tags: tagMap.get(m.id) ?? [],
    groups: groupMap.get(m.id) ?? [],
  }))

  return NextResponse.json({ items: enriched, nextCursor })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await ensureOrgAccessBySlug(
    session.user.id as string,
    org,
    WRITE_ROLES
  )
  if (access.notFound)
    return NextResponse.json({ error: 'Dernek bulunamadı' }, { status: 404 })
  if (!access.allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const json = await req.json()
    const data = CreateMember.parse(json)
    const created = await prisma.member.create({
      data: {
        organizationId: access.org.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email && data.email.length > 0 ? data.email : undefined,
        phone: data.phone && data.phone.length > 0 ? data.phone : undefined,
        status: data.status ?? 'ACTIVE',
        nationalId:
          data.nationalId && data.nationalId.length > 0
            ? data.nationalId
            : undefined,
        address:
          data.address && data.address.length > 0 ? data.address : undefined,
        occupation:
          data.occupation && data.occupation.length > 0
            ? data.occupation
            : undefined,
        joinedAt: data.joinedAt ?? undefined,
      },
      select: { id: true },
    })
    return NextResponse.json({ item: created }, { status: 201 })
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
