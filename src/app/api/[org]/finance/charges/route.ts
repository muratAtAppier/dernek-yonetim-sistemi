import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ensureOrgAccessBySlug, WRITE_ROLES } from '@/lib/authz'

const GenerateCharges = z.object({
  planId: z.string().min(1),
  periodId: z.string().min(1),
  memberIds: z.array(z.string()).optional(),
  amountOverride: z.number().optional(),
  dryRun: z.boolean().optional(),
})

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
    const body = await req.json()
    const data = GenerateCharges.parse(body)

    const plan = await (prisma as any).duesPlan.findFirst({
      where: { id: data.planId, organizationId: access.org.id },
    })
    if (!plan)
      return NextResponse.json({ error: 'Plan bulunamadı' }, { status: 404 })
    const period = await (prisma as any).duesPeriod.findFirst({
      where: { id: data.periodId, planId: plan.id },
    })
    if (!period)
      return NextResponse.json({ error: 'Dönem bulunamadı' }, { status: 404 })

    const memberWhere: any = { organizationId: access.org.id, status: 'ACTIVE' }
    const memberIds = data.memberIds?.length ? data.memberIds : undefined
    if (memberIds) memberWhere.id = { in: memberIds }

    const members = await (prisma as any).member.findMany({
      where: memberWhere,
      select: { id: true },
    })

    const amount = data.amountOverride ?? Number(plan.amount)

    // Check existing charges for the same plan/period to avoid duplicates
    const memberIdList = members.map((m: any) => m.id)
    const existing = memberIdList.length
      ? await (prisma as any).financeTransaction.findMany({
          where: {
            organizationId: access.org.id,
            type: 'CHARGE',
            planId: plan.id,
            periodId: period.id,
            memberId: { in: memberIdList },
          },
          select: { memberId: true },
        })
      : []
    const existingSet = new Set(existing.map((e: any) => e.memberId))
    const toCreate = members.filter((m: any) => !existingSet.has(m.id))

    if (data.dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalSelected: members.length,
        alreadyCharged: existingSet.size,
        willCreate: toCreate.length,
        amount,
      })
    }

    // Create CHARGE transactions only for members without an existing charge
    const created = await prisma.$transaction(async (tx) => {
      const rows = [] as any[]
      for (const m of toCreate) {
        const row = await (tx as any).financeTransaction.create({
          data: {
            organizationId: access.org.id,
            memberId: m.id,
            type: 'CHARGE',
            amount,
            currency: plan.currency,
            planId: plan.id,
            periodId: period.id,
            note: `Otomatik borçlandırma: ${plan.name} / ${period.name}`,
          },
        })
        rows.push(row)
      }
      return rows
    })

    return NextResponse.json({
      totalSelected: members.length,
      alreadyCharged: existingSet.size,
      createdCount: created.length,
      items: created,
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
