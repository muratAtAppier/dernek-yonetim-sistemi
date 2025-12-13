import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-posta adresi gerekli' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      })

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex')

      // Token expires in 1 hour
      const expires = new Date(Date.now() + 60 * 60 * 1000)

      // Create password reset token
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expires,
        },
      })

      // Send email with reset link
      const baseUrl = process.env.NEXTAUTH_URL?.startsWith('http')
        ? process.env.NEXTAUTH_URL
        : 'http://localhost:3000'
      const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

      console.log('Sending password reset email to:', email)
      console.log('Reset URL:', resetUrl)

      await sendMail({
        to: email,
        subject: 'Şifre Sıfırlama',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Şifre Sıfırlama Talebi</h2>
            <p>Merhaba,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
                Şifremi Sıfırla
              </a>
            </p>
            <p>Veya aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.
            </p>
            <p style="color: #666; font-size: 14px;">
              Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
          </div>
        `,
        text: `
Şifre Sıfırlama Talebi

Merhaba,

Şifrenizi sıfırlamak için aşağıdaki bağlantıyı ziyaret edin:
${resetUrl}

Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.

Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
        `,
      })
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    )
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
