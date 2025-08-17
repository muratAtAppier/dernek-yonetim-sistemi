const host = process.env.SMTP_HOST || 'localhost'
const port = Number(process.env.SMTP_PORT || 1025)
const secure = port === 465
const user = process.env.SMTP_USER || undefined
const pass = process.env.SMTP_PASS || undefined

let _transport: any | null = null
function getTransport(): any {
  if (_transport) return _transport
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require('nodemailer')
  _transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })
  return _transport
}

export async function sendMail(opts: {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}) {
  const from = opts.from || process.env.MAIL_FROM || 'noreply@example.test'
  const tx = getTransport()
  return tx.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}
