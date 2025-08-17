'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useToast } from '../../../../components/ui/toast'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const schema = z.object({
  firstName: z.string().min(1, 'Ad zorunludur'),
  lastName: z.string().min(1, 'Soyad zorunludur'),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional().or(z.literal('')),
  phone: z.string().min(5, 'Telefon çok kısa').optional().or(z.literal('')),
  nationalId: z.string().regex(/^\d{11}$/, 'TC Kimlik No 11 haneli olmalı').optional().or(z.literal('')),
  address: z.string().min(3, 'Adres çok kısa').optional().or(z.literal('')),
  occupation: z.string().min(2, 'Meslek çok kısa').optional().or(z.literal('')),
  joinedAt: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'PASSIVE', 'LEFT']).optional(),
})

type FormValues = z.infer<typeof schema>

// Accept loose props to satisfy Next.js PageProps (params may be a Promise in generated types)
export default function NewMemberPage({ params }: any) {
  const router = useRouter()
  useEffect(() => {
    async function guard() {
      const s = await fetch('/api/auth/session').then((r) => r.json()).catch(() => null)
      if (!s?.user) return router.replace('/auth/signin')
      const me = await fetch(`/api/${params.org}/me`).then((r) => r.json()).catch(() => null)
      const role = me?.role as 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'MEMBER' | undefined
      const canWrite = role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF'
      if (!canWrite) router.replace(`/${params.org}/members`)
    }
    guard()
  }, [router, params.org])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })
  const { add } = useToast()

  return (
    <main className="p-6 max-w-xl">
      <Breadcrumbs items={[{ label: 'Üyeler', href: `/${params.org}/members` }, { label: 'Yeni' }]} />
      <h1 className="text-2xl font-semibold">Yeni Üye</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const res = await fetch(`/api/${params.org}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
          })
          if (res.ok) {
            add({ variant: 'success', title: 'Üye oluşturuldu' })
            router.push(`/${params.org}/members`)
            router.refresh()
          } else {
            const data = await res.json().catch(() => null)
            add({ variant: 'error', title: 'Kaydetme hatası', description: data?.error ?? undefined })
          }
        })}
      >
        <div>
          <label className="block text-sm font-medium">Ad</label>
          <input className="mt-1 w-full border rounded px-3 py-2" {...register('firstName')} />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Soyad</label>
          <input className="mt-1 w-full border rounded px-3 py-2" {...register('lastName')} />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message as string}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">E-posta</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Telefon</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...register('phone')} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message as string}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">TC Kimlik No</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...register('nationalId')} />
            {errors.nationalId && <p className="text-sm text-red-600">{errors.nationalId.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Kayıt Tarihi</label>
            <input type="date" className="mt-1 w-full border rounded px-3 py-2" {...register('joinedAt')} />
            {errors.joinedAt && <p className="text-sm text-red-600">{String(errors.joinedAt.message)}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Adres</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={3} {...register('address')} />
          {errors.address && <p className="text-sm text-red-600">{errors.address.message as string}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Meslek</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...register('occupation')} />
            {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Durum</label>
            <select className="mt-1 w-full border rounded px-3 py-2" {...register('status')}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PASSIVE">PASSIVE</option>
              <option value="LEFT">LEFT</option>
            </select>
          </div>
        </div>
        <button disabled={isSubmitting} className="mt-2 px-4 py-2 rounded bg-black text-white disabled:opacity-60">
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </main>
  )
}
