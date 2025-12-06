import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '../../../../../lib/authz'
import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import { normalizePhoneNumber } from '../../../../../lib/utils'

type Row = Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId: string
  status: 'ACTIVE' | 'PASSIVE' | 'LEFT'
  address: string
  occupation: string
  joinedAt: string | Date
}>

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

  const url = new URL(req.url)
  const dryRun = ['1', 'true', 'yes'].includes(
    (url.searchParams.get('dryRun') || '').toLowerCase()
  )

  const ct = (req.headers.get('content-type') || '').toLowerCase()
  let rows: Row[] = []

  try {
    if (ct.includes('application/json')) {
      const json = await req.json()
      rows = Array.isArray(json) ? (json as Row[]) : (json?.rows as Row[]) || []
    } else if (ct.includes('text/csv')) {
      const text = await req.text()
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
      }) as any[]
      rows = records.map((r) => normalizeRow(r))
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as File | null
      if (!file)
        return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
      const ab = await file.arrayBuffer()
      rows = parseXlsx(ab)
    } else if (
      ct.includes(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) ||
      ct.includes('application/octet-stream')
    ) {
      const ab = await req.arrayBuffer()
      rows = parseXlsx(ab)
    } else {
      return NextResponse.json(
        { error: 'Desteklenmeyen içerik türü' },
        { status: 415 }
      )
    }

    // Filter empty rows
    rows = rows.filter(
      (r) => r.firstName || r.lastName || r.email || r.phone || r.nationalId
    )

    // Stats to return (align with UI expectations)
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const details: Array<{ index: number; reason: string }> = []

    // Track duplicates in the same upload by key
    const seen = new Set<string>()

    // helper validators
    const isValidDate = (v: any) => {
      if (!v) return false
      const d = new Date(v as any)
      return !isNaN(d.getTime())
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const idx = i + 1 // 1-based for UX
      const firstName = (r.firstName || '').trim()
      const lastName = (r.lastName || '').trim()
      if (!firstName || !lastName) {
        errors++
        details.push({ index: idx, reason: 'firstName/lastName gerekli' })
        continue
      }

      const nationalId = (r.nationalId || '').trim() || null
      const email = (r.email || '').trim() || null
      const key = nationalId
        ? `NID:${nationalId}`
        : email
          ? `EMAIL:${email.toLowerCase()}`
          : `IDX:${idx}`
      if (seen.has(key)) {
        skipped++
        details.push({
          index: idx,
          reason: 'Aynı anahtarla yinelenen satır (dosya içinde)',
        })
        continue
      }
      seen.add(key)

      // Find existing by nationalId (preferred) or email within same organization
      let existing: { id: string } | null = null
      try {
        if (nationalId) {
          existing = await prisma.member.findFirst({
            where: { organizationId: access.org.id, nationalId },
            select: { id: true },
          })
        }
        if (!existing && email) {
          existing = await prisma.member.findFirst({
            where: { organizationId: access.org.id, email },
            select: { id: true },
          })
        }
      } catch {
        // ignore lookup errors, treat as create
      }

      const data = {
        organizationId: access.org.id,
        firstName,
        lastName,
        email,
        phone: normalizePhoneNumber((r.phone || '').trim() || null),
        nationalId,
        status: (r.status as any) || 'ACTIVE',
        address: (r.address || '').trim() || null,
        occupation: (r.occupation || '').trim() || null,
        joinedAt: isValidDate(r.joinedAt)
          ? new Date(r.joinedAt as any)
          : new Date(),
      }

      if (dryRun) {
        if (existing) updated++
        else created++
        continue
      }

      try {
        if (existing) {
          await prisma.member.update({ where: { id: existing.id }, data })
          updated++
        } else {
          await prisma.member.create({ data })
          created++
        }
      } catch (e: any) {
        // Unique constraint or other errors
        errors++
        details.push({
          index: idx,
          reason: 'Veri yazılamadı (muhtemel eşsiz kısıt ya da doğrulama)',
        })
      }
    }

    return NextResponse.json({
      ok: true,
      results: { created, updated, skipped, errors, details },
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Import hatası' }, { status: 500 })
  }
}

function normalizeRow(r: any): Row {
  const m = (k: string) => String(r[k] ?? r[k?.toLowerCase()] ?? '').trim()
  return {
    firstName: m('firstName') || m('ad') || m('isim'),
    lastName: m('lastName') || m('soyad') || m('soyisim'),
    email: m('email') || m('e-posta') || m('eposta'),
    phone: m('phone') || m('telefon'),
    nationalId: m('nationalId') || m('tc') || m('tcKimlik'),
    status: (m('status')?.toUpperCase() as any) || undefined,
    address: m('address') || m('adres'),
    occupation: m('occupation') || m('meslek'),
    joinedAt: m('joinedAt') || m('kayitTarihi'),
  }
}

function parseXlsx(ab: ArrayBuffer): Row[] {
  const wb = XLSX.read(new Uint8Array(ab), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })
  return json.map((r) => normalizeRow(r))
}

// Ensure Node runtime for XLSX parsing
export const runtime = 'nodejs'
