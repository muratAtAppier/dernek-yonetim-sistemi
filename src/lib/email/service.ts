import { prisma } from '../prisma'
import { sendMail } from '../mail'

interface BulkEmailOptions {
  organizationId: string
  memberIds?: string[]
  emails?: string[]
  subject: string
  message: string
  campaignName?: string
  dryRun?: boolean
  max?: number
  personalize?: boolean
}

export async function sendBulkEmail(opts: BulkEmailOptions) {
  const {
    organizationId,
    memberIds = [],
    emails = [],
    subject,
    message,
    campaignName,
    dryRun,
    max = 1000,
    personalize = true,
  } = opts

  if (!subject || subject.trim().length === 0)
    throw new Error('Konu boş olamaz')
  if (!message || message.trim().length === 0)
    throw new Error('Mesaj boş olamaz')

  // Collect email list from members if requested
  let targets: {
    memberId?: string
    email: string
    firstName?: string
    lastName?: string
  }[] = []
  if (memberIds.length) {
    const rows = await prisma.member.findMany({
      where: { id: { in: memberIds }, organizationId, email: { not: null } },
      select: { id: true, email: true, firstName: true, lastName: true },
    })
    targets = rows
      .filter((r) => !!r.email)
      .map((r) => ({
        memberId: r.id,
        email: r.email!,
        firstName: r.firstName,
        lastName: r.lastName,
      }))
  }
  for (const e of emails) if (e) targets.push({ email: e })

  // Dedup by email
  const seen = new Set<string>()
  targets = targets.filter((t) => {
    const key = t.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (targets.length === 0)
    return { dryRun: !!dryRun, total: 0, sent: 0, failed: 0 }
  if (targets.length > max)
    throw new Error(`Çok fazla alıcı (${targets.length}). Limit: ${max}`)

  // Create campaign
  const campaign = await (prisma as any)['emailCampaign'].create({
    data: {
      organizationId,
      name: campaignName || `Email-${new Date().toISOString()}`,
      subject,
      message,
      channel: 'EMAIL' as any,
      status: dryRun ? 'COMPLETED' : 'SENDING',
      totalRecipients: targets.length,
    },
  })

  if (dryRun)
    return {
      dryRun: true,
      campaignId: campaign.id,
      total: targets.length,
      sent: 0,
      failed: 0,
    }

  let sentCount = 0
  let failedCount = 0

  function render(msg: string, t: { firstName?: string; lastName?: string }) {
    if (!personalize) return msg
    const fn = t.firstName || ''
    const ln = t.lastName || ''
    return msg
      .replace(/\{\s*ad\s*\}/gi, fn)
      .replace(/\{\s*soyad\s*\}/gi, ln)
      .replace(/\{\s*tam_ad\s*\}/gi, (fn + ' ' + ln).trim())
  }

  for (const target of targets) {
    const personalized = render(message, target)
    try {
      await sendMail({
        to: target.email,
        subject,
        text: personalized,
        html: personalized.replace(/\n/g, '<br>'),
      })
      await (prisma as any).emailMessage.create({
        data: {
          organizationId,
          campaignId: campaign.id,
          memberId: target.memberId,
          email: target.email,
          subject,
          content: personalized,
          channel: 'EMAIL' as any,
          status: 'SENT' as any,
          sentAt: new Date(),
        },
      })
      sentCount++
    } catch (error: any) {
      await (prisma as any).emailMessage.create({
        data: {
          organizationId,
          campaignId: campaign.id,
          memberId: target.memberId,
          email: target.email,
          subject,
          content: personalized,
          channel: 'EMAIL' as any,
          status: 'FAILED' as any,
          error: error?.message,
        },
      })
      failedCount++
    }
  }

  await (prisma as any)['emailCampaign'].update({
    where: { id: campaign.id },
    data: {
      status:
        failedCount === 0
          ? 'COMPLETED'
          : sentCount > 0
            ? 'COMPLETED'
            : 'FAILED',
      sentCount,
      failedCount,
      completedAt: new Date(),
    },
  })

  return {
    dryRun: false,
    campaignId: campaign.id,
    total: targets.length,
    sent: sentCount,
    failed: failedCount,
  }
}
