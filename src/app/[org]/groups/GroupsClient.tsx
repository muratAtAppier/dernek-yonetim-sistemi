'use client'

import React from 'react'
import { useToast } from '../../../components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { ListRow } from '@/components/ui/list-row'

type Group = { id: string; name: string; type: 'GROUP' | 'COMMISSION'; color?: string | null; description?: string | null }

export function GroupsClient({ org, canWrite, initialItems }: { org: string; canWrite: boolean; initialItems: Group[] }) {
  const [items, setItems] = React.useState<Group[]>(initialItems)
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<'GROUP' | 'COMMISSION'>('GROUP')
  const [color, setColor] = React.useState<string>('')
  const [description, setDescription] = React.useState<string>('')
  const [editing, setEditing] = React.useState<Group | null>(null)
  const [managing, setManaging] = React.useState<Group | null>(null)
  const [mgrSearch, setMgrSearch] = React.useState('')
  const [mgrOnlyInGroup, setMgrOnlyInGroup] = React.useState(true)
  const [mgrLoading, setMgrLoading] = React.useState(false)
  const [mgrMembers, setMgrMembers] = React.useState<Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; groups?: Array<{ id: string }> }>>([])
  const [mgrSelected, setMgrSelected] = React.useState<string[]>([])
  const { add } = useToast()

  async function refresh() {
    try {
      const res = await fetch(`/api/${org}/groups`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items || [])
    } catch {}
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return
    try {
      const res = await fetch(`/api/${org}/groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, color: color || undefined, description: description || undefined }) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Grup eklenemedi', description: data?.error })
      }
      setName(''); setType('GROUP'); setColor(''); setDescription('')
      await refresh()
      add({ variant: 'success', title: 'Grup eklendi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  async function updateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite || !editing) return
    try {
      const res = await fetch(`/api/${org}/groups`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, name: editing.name, type: editing.type, color: editing.color ?? null, description: editing.description ?? null }) })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Grup güncellenemedi', description: data?.error })
      }
      setEditing(null)
      await refresh()
      add({ variant: 'success', title: 'Grup güncellendi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  async function remove(id: string) {
    if (!canWrite) return
    if (!confirm('Silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    try {
      const res = await fetch(`/api/${org}/groups?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'Grup silinemedi', description: data?.error })
      }
      await refresh()
      add({ variant: 'success', title: 'Grup silindi' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  async function loadManageMembers(group: Group, opts?: { q?: string; onlyInGroup?: boolean }) {
    try {
      setMgrLoading(true)
      const params = new URLSearchParams()
      const q = (opts?.q ?? mgrSearch).trim()
      if (q) params.set('q', q)
      params.set('take', '50')
      const only = opts?.onlyInGroup ?? mgrOnlyInGroup
      if (only) {
        params.append('group', group.id)
        params.set('groupsMode', 'or')
      }
      const res = await fetch(`/api/${org}/members?${params.toString()}`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : { items: [] }
      setMgrMembers(Array.isArray(data.items) ? data.items : [])
    } catch {
      setMgrMembers([])
    } finally {
      setMgrLoading(false)
    }
  }

  function openManage(g: Group) {
    setManaging(g)
    setMgrSelected([])
    setMgrSearch('')
    setMgrOnlyInGroup(true)
    loadManageMembers(g, { onlyInGroup: true })
  }

  function toggleMgrSelected(id: string) {
  setMgrSelected((prev: string[]) => (prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]))
  }

  async function applyManage(action: 'assign' | 'unassign') {
    if (!canWrite || !managing) return
    if (mgrSelected.length === 0) return add({ variant: 'error', title: 'Seçim yok', description: 'Lütfen en az bir üye seçin.' })
    try {
      const res = await fetch(`/api/${org}/members/groups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: mgrSelected, groupId: managing.id, action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({ variant: 'error', title: 'İşlem başarısız', description: data?.error })
      }
      add({ variant: 'success', title: action === 'assign' ? 'Üyeler gruba eklendi' : 'Üyeler gruptan çıkarıldı' })
      setMgrSelected([])
      await loadManageMembers(managing)
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="mb-2 font-semibold">Mevcut Gruplar</h2>
        <ul className="divide-y rounded-md border bg-card">
          {items.length === 0 && <li className="p-3 text-sm text-muted-foreground">Henüz grup yok.</li>}
          {items.map((g: Group) => (
            <ListRow key={g.id} className="gap-3">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: g.color || '#e2e8f0' }} />
                  {g.name}
                  <Badge variant="secondary">{g.type === 'COMMISSION' ? 'Komisyon' : 'Grup'}</Badge>
                </div>
                {g.description && <div className="mt-0.5 text-xs text-muted-foreground">{g.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Link className="text-xs underline" href={`/${org}/members?group=${encodeURIComponent(g.id)}&groupsMode=or`}>Üyeleri görüntüle</Link>
                {canWrite && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(g)}>Düzenle</Button>
                    <Button size="sm" variant="outline" onClick={() => openManage(g)}>Üyeleri yönet</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(g.id)}>Sil</Button>
                  </>
                )}
              </div>
            </ListRow>
          ))}
        </ul>
      </div>
      <div>
        {canWrite ? (
          <div className="space-y-6">
            <form onSubmit={createGroup} className="space-y-2 rounded-md border bg-card p-3">
              <h2 className="font-semibold">Yeni Grup / Komisyon</h2>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad" required />
              <div className="flex items-center gap-2">
                <Select value={type} onChange={(e) => setType(e.target.value as any)} className="w-[160px]">
                  <option value="GROUP">Grup</option>
                  <option value="COMMISSION">Komisyon</option>
                </Select>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#Renk (opsiyonel)" />
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama (opsiyonel)" className="w-full rounded-md border border-input bg-background px-3 py-2" rows={3} />
              <Button type="submit">Ekle</Button>
            </form>

            {editing && (
              <form onSubmit={updateGroup} className="space-y-2 rounded-md border bg-card p-3">
                <h2 className="font-semibold">Grubu Düzenle</h2>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ad" required />
                <div className="flex items-center gap-2">
                  <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as any })} className="w-[160px]">
                    <option value="GROUP">Grup</option>
                    <option value="COMMISSION">Komisyon</option>
                  </Select>
                  <Input value={editing.color || ''} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="#Renk (opsiyonel)" />
                </div>
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

      {managing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setManaging(null)} />
          <div className="relative w-[680px] max-w-[95vw] max-h-[85vh] overflow-auto rounded border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Üyeleri Yönet — {managing.name}</h3>
              <Button size="sm" variant="outline" onClick={() => setManaging(null)}>Kapat</Button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={mgrSearch}
                onChange={(e) => setMgrSearch(e.target.value)}
                placeholder="Üye ara (ad, soyad, e-posta, telefon)"
                className="flex-1"
              />
              <label className="text-xs flex items-center gap-1 px-2 py-1 border rounded">
                <Checkbox checked={mgrOnlyInGroup} onChange={(e) => { const checked = (e.target as HTMLInputElement).checked; setMgrOnlyInGroup(checked); loadManageMembers(managing, { onlyInGroup: checked }) }} />
                <span>Sadece bu gruptakiler</span>
              </label>
              <Button variant="outline" onClick={() => loadManageMembers(managing, { q: mgrSearch })}>Ara</Button>
            </div>
      <div className="border rounded">
              <div className="flex items-center justify-between p-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">Sonuçlar: {mgrMembers.length} {mgrLoading && <Spinner size={12} />}</span>
                <span>Seçili: {mgrSelected.length}</span>
              </div>
              <ul className="divide-y max-h-[50vh] overflow-auto">
                {mgrMembers.map((m: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; groups?: Array<{ id: string }> }) => {
                  const inGroup = (m.groups || []).some((gg) => gg.id === managing.id)
                  return (
                    <li key={m.id} className="p-2 flex items-center gap-3 hover:bg-accent/50 transition-colors">
                      <Checkbox checked={mgrSelected.includes(m.id)} onChange={() => toggleMgrSelected(m.id)} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{m.firstName} {m.lastName}</div>
                        <div className="text-xs text-muted-foreground">{m.email ?? 'E-posta yok'} • {m.phone ?? 'Telefon yok'}</div>
                      </div>
                      <Badge variant={inGroup ? 'secondary' : 'outline'}>{inGroup ? 'Grupta' : 'Değil'}</Badge>
                    </li>
                  )
                })}
                {mgrMembers.length === 0 && !mgrLoading && (
                  <li className="p-3 text-sm text-muted-foreground">Kayıt bulunamadı.</li>
                )}
              </ul>
            </div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={() => setMgrSelected([])}>Seçimi temizle</Button>
              {canWrite && (
                <>
                  <Button variant="outline" onClick={() => applyManage('assign')}>Gruba Ekle</Button>
                  <Button variant="outline" onClick={() => applyManage('unassign')}>Gruptan Çıkar</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
