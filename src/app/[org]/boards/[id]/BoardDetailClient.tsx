'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

type MemberLite = { id: string; firstName: string; lastName: string; email?: string | null }
type TermMember = { memberId: string; role: 'PRESIDENT' | 'VICE_PRESIDENT' | 'SECRETARY' | 'TREASURER' | 'MEMBER' | 'SUPERVISOR'; order: number; member?: MemberLite }
type Term = { id: string; name?: string | null; isActive: boolean; startDate: string; endDate?: string | null; members?: Array<{ member: MemberLite; role: TermMember['role']; order: number }> }
type Decision = { id: string; title: string; decisionNo?: string | null; decisionDate: string; content: string }

export function BoardDetailClient({ org, boardId, boardName, canWrite = false }: { org: string; boardId: string; boardName?: string; canWrite?: boolean }) {
  const { add } = useToast()
  const [terms, setTerms] = React.useState<Term[]>([])
  const [selectedTermId, setSelectedTermId] = React.useState<string>('')
  const [editingMembers, setEditingMembers] = React.useState<TermMember[]>([])
  const [memberSearch, setMemberSearch] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<MemberLite[]>([])
  const [loading, setLoading] = React.useState(false)

  const [newTerm, setNewTerm] = React.useState<{ name: string; startDate: string; endDate: string; isActive: boolean }>({ name: '', startDate: '', endDate: '', isActive: false })

  const [decisions, setDecisions] = React.useState<Decision[]>([])
  const [newDecision, setNewDecision] = React.useState<{ title: string; decisionNo: string; decisionDate: string; content: string }>({ title: '', decisionNo: '', decisionDate: '', content: '' })

  async function loadTerms(selectFirst = false) {
    setLoading(true)
    try {
      const res = await fetch(`/api/${org}/boards/terms?boardId=${encodeURIComponent(boardId)}`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : { items: [] }
      const items = (data.items || []) as Term[]
      setTerms(items)
      let sel = selectedTermId
      if ((selectFirst || !sel) && items.length) sel = items.find((t) => t.isActive)?.id || items[0].id
      setSelectedTermId(sel)
      if (sel) await loadTermMembers(sel)
    } finally {
      setLoading(false)
    }
  }

  async function loadTermMembers(termId: string) {
    const res = await fetch(`/api/${org}/boards/members?termId=${encodeURIComponent(termId)}`, { cache: 'no-store' })
    const data = res.ok ? await res.json() : { items: [] }
    const items = (data.items || []) as Array<{ member: MemberLite; role: TermMember['role']; order: number } & { memberId?: string }>
    const mapped: TermMember[] = items.map((x, idx) => ({ memberId: (x as any).memberId || x.member.id, role: x.role, order: x.order ?? idx + 1, member: x.member }))
    setEditingMembers(mapped)
  }

  React.useEffect(() => { loadTerms(true); loadDecisions() }, [])

  async function searchMembers() {
    const q = memberSearch.trim()
    if (!q) { setSearchResults([]); return }
    const params = new URLSearchParams({ q, take: '50' })
    const res = await fetch(`/api/${org}/members?${params.toString()}`, { cache: 'no-store' })
    const data = res.ok ? await res.json() : { items: [] }
    setSearchResults((data.items || []) as MemberLite[])
  }

  function addMember(m: MemberLite) {
    if (editingMembers.some((e) => e.memberId === m.id)) return
    const maxOrder = editingMembers.reduce((a, b) => Math.max(a, b.order || 0), 0)
    setEditingMembers([...editingMembers, { memberId: m.id, role: 'MEMBER', order: maxOrder + 1, member: m }])
  }
  function removeMember(memberId: string) {
    setEditingMembers(editingMembers.filter((e) => e.memberId !== memberId))
  }
  function changeRole(memberId: string, role: TermMember['role']) {
    setEditingMembers(editingMembers.map((e) => (e.memberId === memberId ? { ...e, role } : e)))
  }
  function changeOrder(memberId: string, order: number) {
    setEditingMembers(editingMembers.map((e) => (e.memberId === memberId ? { ...e, order } : e)))
  }

  async function saveMembers() {
    if (!canWrite) return
    if (!selectedTermId) return
    const items = editingMembers.map(({ memberId, role, order }) => ({ memberId, role, order }))
    const res = await fetch(`/api/${org}/boards/members`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ termId: selectedTermId, items, replace: true }) })
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      return add({ variant: 'error', title: 'Üyeler kaydedilemedi', description: d?.error })
    }
    add({ variant: 'success', title: 'Üyeler güncellendi' })
    await loadTermMembers(selectedTermId)
  }

  async function createTerm(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return
    const payload: any = { boardId, name: newTerm.name || undefined, isActive: newTerm.isActive }
    if (newTerm.startDate) payload.startDate = newTerm.startDate
    if (newTerm.endDate) payload.endDate = newTerm.endDate
    const res = await fetch(`/api/${org}/boards/terms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      return add({ variant: 'error', title: 'Dönem oluşturulamadı', description: d?.error })
    }
    setNewTerm({ name: '', startDate: '', endDate: '', isActive: false })
    await loadTerms(true)
    add({ variant: 'success', title: 'Dönem eklendi' })
  }

  async function setActive(termId: string) {
    if (!canWrite) return
    const res = await fetch(`/api/${org}/boards/terms`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: termId, isActive: true }) })
    if (!res.ok) return add({ variant: 'error', title: 'Aktif etme başarısız' })
    await loadTerms(true)
  }
  async function deleteTerm(termId: string) {
    if (!canWrite) return
    if (!confirm('Dönemi silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/${org}/boards/terms?id=${encodeURIComponent(termId)}`, { method: 'DELETE' })
    if (!res.ok) return add({ variant: 'error', title: 'Dönem silinemedi' })
    if (selectedTermId === termId) setSelectedTermId('')
    await loadTerms(true)
  }

  async function loadDecisions() {
    const res = await fetch(`/api/${org}/boards/decisions?boardId=${encodeURIComponent(boardId)}`, { cache: 'no-store' })
    const data = res.ok ? await res.json() : { items: [] }
    setDecisions((data.items || []) as Decision[])
  }
  async function addDecision(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return
    if (!newDecision.title.trim() || !newDecision.content.trim()) return
    const payload: any = { boardId, title: newDecision.title.trim(), content: newDecision.content }
    if (newDecision.decisionNo) payload.decisionNo = newDecision.decisionNo
    if (newDecision.decisionDate) payload.decisionDate = newDecision.decisionDate
    if (selectedTermId) payload.termId = selectedTermId
    const res = await fetch(`/api/${org}/boards/decisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) return add({ variant: 'error', title: 'Karar eklenemedi' })
    setNewDecision({ title: '', decisionNo: '', decisionDate: '', content: '' })
    await loadDecisions()
  }
  async function deleteDecision(id: string) {
    if (!canWrite) return
    if (!confirm('Kararı silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/${org}/boards/decisions?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) return add({ variant: 'error', title: 'Karar silinemedi' })
    await loadDecisions()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Dönemler</h2>
          <div className="flex items-center gap-2">
            <Select value={selectedTermId} onChange={(e) => { const id = (e.target as HTMLSelectElement).value; setSelectedTermId(id); if (id) loadTermMembers(id) }} className="h-8 w-[240px]">
              <option value="">Dönem seçin…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name || 'Dönem'} {t.isActive ? ' (Aktif)' : ''}</option>
              ))}
            </Select>
            {selectedTermId && <Button size="sm" variant="outline" onClick={() => setActive(selectedTermId)} disabled={!canWrite}>Aktif Yap</Button>}
            {selectedTermId && <Button size="sm" variant="destructive" onClick={() => deleteTerm(selectedTermId)} disabled={!canWrite}>Sil</Button>}
          </div>
        </div>
        <form onSubmit={createTerm} className="space-y-2 rounded border p-2">
          <div className="text-sm font-medium">Yeni Dönem</div>
          <Input value={newTerm.name} onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })} placeholder="Ad (opsiyonel)" disabled={!canWrite} />
          <div className="flex items-center gap-2">
            <label className="text-xs">Başlangıç</label>
            <Input type="date" value={newTerm.startDate} onChange={(e) => setNewTerm({ ...newTerm, startDate: e.target.value })} className="h-8 w-[170px]" disabled={!canWrite} />
            <label className="text-xs">Bitiş</label>
            <Input type="date" value={newTerm.endDate} onChange={(e) => setNewTerm({ ...newTerm, endDate: e.target.value })} className="h-8 w-[170px]" disabled={!canWrite} />
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={newTerm.isActive} onChange={(e) => setNewTerm({ ...newTerm, isActive: e.currentTarget.checked })} disabled={!canWrite} />
              Aktif
            </label>
            <Button size="sm" type="submit" disabled={!canWrite}>Ekle</Button>
          </div>
        </form>
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Üyeler</div>
          {selectedTermId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Üye ara" className="h-8" />
                <Button size="sm" variant="outline" onClick={searchMembers}>Ara</Button>
              </div>
              {searchResults.length > 0 && (
                <ul className="max-h-[180px] overflow-auto rounded border">
                  {searchResults.map((m) => (
                    <li key={m.id} className="flex items-center justify-between p-2 border-b last:border-b-0 text-sm">
                      <div>{m.firstName} {m.lastName} <span className="text-xs text-muted-foreground">{m.email || ''}</span></div>
                      <Button size="sm" variant="outline" onClick={() => addMember(m)} disabled={!canWrite}>Ekle</Button>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="rounded border divide-y">
                {editingMembers.map((e) => (
                  <li key={e.memberId} className="flex items-center gap-2 p-2 text-sm">
                    <div className="flex-1">{e.member?.firstName} {e.member?.lastName}</div>
                    <Select value={e.role} onChange={(ev) => changeRole(e.memberId, ev.currentTarget.value as any)} className="h-8 w-[180px]" disabled={!canWrite}>
                      <option value="PRESIDENT">Başkan</option>
                      <option value="VICE_PRESIDENT">Başkan Yrd.</option>
                      <option value="SECRETARY">Sekreter</option>
                      <option value="TREASURER">Sayman</option>
                      <option value="MEMBER">Üye</option>
                      <option value="SUPERVISOR">Denetçi</option>
                    </Select>
                    <Input type="number" value={e.order} onChange={(ev) => changeOrder(e.memberId, Number(ev.target.value) || 0)} className="h-8 w-16" disabled={!canWrite} />
                    <Button size="sm" variant="destructive" onClick={() => removeMember(e.memberId)} disabled={!canWrite}>Kaldır</Button>
                  </li>
                ))}
                {editingMembers.length === 0 && <li className="p-2 text-sm text-muted-foreground">Üye seçilmedi.</li>}
              </ul>
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => loadTermMembers(selectedTermId)}>Yenile</Button>
                <Button size="sm" onClick={saveMembers} disabled={!canWrite}>Kaydet</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Önce bir dönem seçin.</div>
          )}
        </div>
      </section>
      <section className="rounded border bg-card p-3">
        <h2 className="font-semibold mb-2">Kararlar</h2>
        <form onSubmit={addDecision} className="space-y-2 rounded border p-2 mb-3">
          <Input value={newDecision.title} onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })} placeholder="Başlık" required disabled={!canWrite} />
          <div className="flex items-center gap-2">
            <Input value={newDecision.decisionNo} onChange={(e) => setNewDecision({ ...newDecision, decisionNo: e.target.value })} placeholder="Karar No (ops.)" className="h-8 w-[160px]" disabled={!canWrite} />
            <Input type="date" value={newDecision.decisionDate} onChange={(e) => setNewDecision({ ...newDecision, decisionDate: e.target.value })} className="h-8 w-[160px]" disabled={!canWrite} />
            <Button size="sm" type="submit" disabled={!canWrite}>Ekle</Button>
          </div>
          <textarea value={newDecision.content} onChange={(e) => setNewDecision({ ...newDecision, content: e.target.value })} placeholder="İçerik" rows={4} className="w-full rounded border px-2 py-1" disabled={!canWrite} />
        </form>
        <ul className="divide-y rounded border">
          {decisions.map((d) => (
            <li key={d.id} className="p-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{d.title} {d.decisionNo && <Badge variant="secondary" className="ml-1">{d.decisionNo}</Badge>}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(d.decisionDate).toLocaleDateString()}</span>
                  <Button size="sm" variant="destructive" onClick={() => deleteDecision(d.id)} disabled={!canWrite}>Sil</Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{d.content}</div>
            </li>
          ))}
          {decisions.length === 0 && <li className="p-2 text-sm text-muted-foreground">Henüz karar yok.</li>}
        </ul>
      </section>
    </div>
  )
}
