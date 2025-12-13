'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Geçersiz veya eksik token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Geçersiz veya eksik token')
      return
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="mx-auto max-w-md py-10">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-green-600">
            Şifre Sıfırlandı!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Şifreniz başarıyla değiştirildi. Giriş sayfasına
            yönlendiriliyorsunuz...
          </p>
          <div className="mt-6">
            <Link href="/auth/signin">
              <Button className="w-full">Giriş Sayfasına Git</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Şifre Sıfırla</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Yeni şifrenizi girin.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border bg-card p-4"
      >
        <div>
          <label className="block text-sm font-medium">Yeni Şifre</label>
          <div className="relative mt-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Şifre Tekrar</label>
          <div className="relative mt-1">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !password || !confirmPassword || !token}
        >
          {loading ? 'Şifre Sıfırlanıyor…' : 'Şifremi Sıfırla'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md py-10">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
