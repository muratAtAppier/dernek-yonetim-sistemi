'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Bir hata oluştu')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md py-10">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            E-posta Gönderildi
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine
            gönderildi. Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak
            şifrenizi sıfırlayın.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Bağlantı 1 saat içinde geçerliliğini yitirecektir.
          </p>
          <div className="mt-6">
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Şifremi Unuttum</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border bg-card p-4"
      >
        <div>
          <label className="block text-sm font-medium">E-posta</label>
          <Input
            type="email"
            className="mt-1"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? 'Gönderiliyor…' : 'Şifre Sıfırlama Bağlantısı Gönder'}
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/signin" className="text-primary hover:underline">
            Giriş sayfasına dön
          </Link>
        </div>
      </form>
    </main>
  )
}
