import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendMail } from '@/lib/mail'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const to = String(
      body.to || process.env.MAIL_TO_DEFAULT || 'test@localhost'
    )
    const subject = String(body.subject || 'Test Mail')
    const text = String(body.text || 'Merhaba, bu bir test e-postasıdır.')
    await sendMail({ to, subject, text })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
