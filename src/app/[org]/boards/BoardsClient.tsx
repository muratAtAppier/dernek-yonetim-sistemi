'use client'

import React from 'react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ListRow } from '@/components/ui/list-row'
import Link from 'next/link'

export type Board = {
  id: string
  type: 'EXECUTIVE' | 'AUDIT'
  name: string
  description?: string | null
  terms?: Array<{ id: string; name?: string | null; isActive: boolean; startDate: string; endDate?: string | null; members: Array<{ member: { id: string; firstName: string; lastName: string } }> }>
}

export function BoardsClient({ org, canWrite, initialItems }: { org: string; canWrite: boolean; initialItems: Board[] }) {
  const [items, setItems] = React.useState<Board[]>(initialItems)
  const [type, setType] = React.useState<'EXECUTIVE' | 'AUDIT'>('EXECUTIVE')
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [editing, setEditing] = React.useState<Board | null>(null)
  const { add } = useToast()

  async function refresh() {
    try {
      const res = await fetch(`/api/${org}/boards`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items || [])
    } catch {}
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return
    try {
      const res = await fetch(`/api/${org}/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, name, description: description || undefined }) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Kurul eklenemedi', description: data?.error })
      }
      setType('EXECUTIVE'); setName(''); setDescription('')
      await refresh()
      add({ variant: 'success', title: 'Kurul eklendi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  async function updateBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite || !editing) return
    try {
      const res = await fetch(`/api/${org}/boards`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, name: editing.name, description: editing.description ?? null }) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Kurul güncellenemedi', description: data?.error })
      }
      setEditing(null)
      await refresh()
      add({ variant: 'success', title: 'Kurul güncellendi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  async function remove(id: string) {
    if (!canWrite) return
    if (!confirm('Silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    try {
      const res = await fetch(`/api/${org}/boards?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Kurul silinemedi', description: data?.error })
      }
      await refresh()
      add({ variant: 'success', title: 'Kurul silindi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="mb-2 font-semibold">Mevcut Kurullar</h2>
        <ul className="divide-y rounded-md border bg-card">
          {items.length === 0 && <li className="p-3 text-sm text-muted-foreground">Henüz kurul yok.</li>}
          {items.map((b) => {
            const activeTerm = (b.terms || [])[0]
            const members = activeTerm?.members || []
            return (
              <ListRow key={b.id} className="gap-3">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {b.name}
                    <Badge variant="secondary">{b.type === 'AUDIT' ? 'Denetim Kurulu' : 'Yönetim Kurulu'}</Badge>
                  </div>
                  {b.description && <div className="mt-0.5 text-xs text-muted-foreground">{b.description}</div>}
                  {activeTerm && (
                    <div className="mt-1 text-xs">
                      Aktif dönem: <strong>{activeTerm.name || new Date(activeTerm.startDate).getFullYear() + (activeTerm.endDate ? ' - ' + new Date(activeTerm.endDate).getFullYear() : '')}</strong>
                      {members.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {members.map((m, i) => (
                            <Badge key={m.member.id} variant="outline">{m.member.firstName} {m.member.lastName}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/${org}/boards/${b.id}`} className="text-xs underline">Yönet</Link>
                  {canWrite && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing(b)}>Düzenle</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Sil</Button>
                    </>
                  )}
                </div>
              </ListRow>
            )
          })}
        </ul>
      </div>
      <div>
        {canWrite ? (
          <div className="space-y-6">
            <form onSubmit={createBoard} className="space-y-2 rounded-md border bg-card p-3">
              <h2 className="font-semibold">Yeni Kurul</h2>
              <div className="flex items-center gap-2">
                <Select value={type} onChange={(e) => setType(e.target.value as any)} className="w-[200px]">
                  <option value="EXECUTIVE">Yönetim Kurulu</option>
                  <option value="AUDIT">Denetim Kurulu</option>
                </Select>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad" required />
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama (opsiyonel)" className="w-full rounded-md border border-input bg-background px-3 py-2" rows={3} />
              <Button type="submit">Ekle</Button>
            </form>

            {editing && (
              <form onSubmit={updateBoard} className="space-y-2 rounded-md border bg-card p-3">
                <h2 className="font-semibold">Kurulu Düzenle</h2>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ad" required />
                <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Açıklama (opsiyonel)" className="w-full rounded-md border border-input bg-background px-3 py-2" rows={3} />
                <div className="flex items-center gap-2">
                  <Button type="submit">Kaydet</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>Vazgeç</Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Yalnızca görüntüleme yetkiniz var.</div>
        )}
      </div>
    </div>
  )
}
