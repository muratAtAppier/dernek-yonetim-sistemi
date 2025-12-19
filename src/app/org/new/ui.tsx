'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

// Regex pattern for website validation (with or without protocol)
const websitePattern =
  /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\/?.*$/

const schema = z.object({
  name: z.string().min(3, 'En az 3 karakter'),
  responsibleFirstName: z.string().min(2, 'En az 2 karakter'),
  responsibleLastName: z.string().min(2, 'En az 2 karakter'),
  description: z.string().optional(),
  email: z.string().email('Geçerli e‑posta girin').optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z
    .string()
    .regex(websitePattern, 'Geçerli web adresi girin')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function NewOrganizationForm() {
  const router = useRouter()
  const toast = useToast()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setLogoFile(null)
      setLogoPreview(null)
    }
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit(async (values) => {
        const formData = new FormData()
        formData.append('name', values.name)
        formData.append('responsibleFirstName', values.responsibleFirstName)
        formData.append('responsibleLastName', values.responsibleLastName)
        if (values.description)
          formData.append('description', values.description)
        if (values.email) formData.append('email', values.email)
        if (values.password) formData.append('password', values.password)
        if (values.phone) formData.append('phone', values.phone)
        if (values.address) formData.append('address', values.address)
        if (values.website) formData.append('website', values.website)
        if (logoFile) formData.append('logo', logoFile)

        const res = await fetch('/api/org', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const json = await res.json().catch(() => null)
          const slug = json?.item?.slug as string | undefined
          toast.add({ variant: 'success', title: 'Dernek oluşturuldu' })
          if (slug) {
            router.push(`/${slug}/members`)
          } else {
            router.push('/org')
          }
          router.refresh()
        } else {
          const data = await res.json().catch(() => null)
          // Try to map validation issues to fields
          const issues =
            (data?.details as
              | Array<{ path?: (string | number)[]; message?: string }>
              | undefined) ?? []
          if (Array.isArray(issues) && issues.length > 0) {
            issues.forEach((i) => {
              const name = Array.isArray(i.path)
                ? (i.path.join('.') as keyof FormValues)
                : undefined
              if (name && i.message) {
                // @ts-ignore react-hook-form name typing
                setError(name, { type: 'server', message: i.message })
              }
            })
          }
          toast.add({
            variant: 'error',
            title: 'Hata',
            description: data?.error ?? 'Kaydetme hatası',
          })
        }
      })}
    >
      {/* Section: Dernek Bilgileri */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Dernek Bilgileri</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Dernek Adı <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="Örn: İstanbul Yazılım Derneği"
              className="h-11"
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Açıklama</label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
              {...register('description')}
              placeholder="Dernek hakkında kısa bir açıklama (opsiyonel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative group">
                  <img
                    src={logoPreview}
                    alt="Logo önizleme"
                    className="h-16 w-16 object-contain rounded-xl border-2 border-border bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview(null)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                    aria-label="Logoyu kaldır"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-muted-foreground/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-input bg-background hover:bg-muted transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Logo Yükle
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Section: Sorumlu Kişi */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sorumlu Kişi</h2>
            <p className="text-sm text-muted-foreground">
              Dernek yöneticisi hesap bilgileri
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Ad <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('responsibleFirstName')}
              placeholder="Ad"
              className="h-11"
            />
            {errors.responsibleFirstName && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.responsibleFirstName.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Soyad <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('responsibleLastName')}
              placeholder="Soyad"
              className="h-11"
            />
            {errors.responsibleLastName && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.responsibleLastName.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">E‑posta</label>
            <Input
              {...register('email')}
              placeholder="info@ornek.org"
              className="h-11"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.email.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Şifre</label>
            <Input
              type="password"
              {...register('password')}
              placeholder="En az 6 karakter"
              className="h-11"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.password.message as string}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Section: İletişim Bilgileri */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">İletişim Bilgileri</h2>
            <p className="text-sm text-muted-foreground">
              Dernek iletişim bilgileri (opsiyonel)
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Telefon</label>
            <Input
              {...register('phone')}
              placeholder="(5xx) xxx xx xx"
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <Input
              {...register('website')}
              placeholder="https://ornek.org"
              className="h-11"
            />
            {errors.website && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.website.message as string}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Adres</label>
            <Input
              {...register('address')}
              placeholder="Açık adres"
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          className="px-6"
        >
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/25"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Kaydediliyor…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Derneği Oluştur
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}
