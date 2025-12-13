'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Süper yönetici olarak giriş yapın ve dernek oluşturun.
      </p>
      <div className="mt-6 space-y-3 rounded-lg border bg-card p-4">
        <div>
          <label className="block text-sm font-medium">E‑posta</label>
          <Input
            className="mt-1"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Şifre</label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <div className="relative mt-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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
        <Button
          className="w-full"
          disabled={loading || !email || !password}
          onClick={async () => {
            setLoading(true)
            try {
              // Use redirect:false so we can accurately detect success
              const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
              })
              if (res?.ok) {
                // Fetch role info to determine redirect
                const roleRes = await fetch('/api/auth/role-info')
                if (roleRes.ok) {
                  const { isSuperAdmin, firstOrg } = await roleRes.json()
                  if (isSuperAdmin) {
                    router.push('/org')
                  } else if (firstOrg?.slug) {
                    router.push(`/${firstOrg.slug}`)
                  } else {
                    router.push('/org')
                  }
                } else {
                  router.push('/org')
                }
              } else {
                alert('Giriş başarısız')
              }
            } finally {
              setLoading(false)
            }
          }}
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </Button>
      </div>
    </main>
  )
}
