'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  name: z.string().min(3, 'En az 3 karakter'),
  slug: z
    .string()
    .min(3, 'En az 3 karakter')
    .regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire'),
  description: z.string().optional(),
  email: z.string().email('Geçerli e‑posta girin').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Geçerli URL girin').optional(),
  logoUrl: z.string().url('Geçerli URL girin').optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewOrganizationForm() {
  const router = useRouter()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    setValue,
  setError,
  formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const res = await fetch('/api/org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
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
          const issues = (data?.details as Array<{ path?: (string | number)[]; message?: string }> | undefined) ?? []
          if (Array.isArray(issues) && issues.length > 0) {
            issues.forEach((i) => {
              const name = Array.isArray(i.path) ? (i.path.join('.') as keyof FormValues) : undefined
              if (name && i.message) {
                // @ts-ignore react-hook-form name typing
                setError(name, { type: 'server', message: i.message })
              }
            })
          }
          toast.add({ variant: 'error', title: 'Hata', description: data?.error ?? 'Kaydetme hatası' })
        }
      })}
    >
  <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Ad</label>
          <Input
            className="mt-1"
            {...register('name')}
            onChange={(e) => {
              const val = e.target.value
              setValue('name', val)
              setValue('slug', slugify(val))
            }}
            placeholder="Örn: İstanbul Yazılım Derneği"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Slug</label>
          <Input className="mt-1" {...register('slug')} placeholder="istanbul-yazilim-dernegi" />
          <p className="mt-1 text-xs text-muted-foreground">URL'de kullanılacak benzersiz kısa ad.</p>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">E‑posta</label>
          <Input className="mt-1" {...register('email')} placeholder="info@ornek.org" />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Telefon</label>
          <Input className="mt-1" {...register('phone')} placeholder="(5xx) xxx xx xx" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Website</label>
          <Input className="mt-1" {...register('website')} placeholder="https://ornek.org" />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website.message as string}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Adres</label>
          <Input className="mt-1" {...register('address')} placeholder="Açık adres" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium">Logo URL</label>
          <Input className="mt-1" {...register('logoUrl')} placeholder="https://.../logo.png" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Açıklama</label>
        <textarea
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          rows={4}
          {...register('description')}
          placeholder="Kısa açıklama (opsiyonel)"
        />
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}</Button>
      </div>
    </form>
  )
}
