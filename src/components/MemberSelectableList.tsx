'use client'

import React from 'react'
import Link from 'next/link'
import { useToast } from './ui/toast'
import { Button } from './ui/button'
import { LinkButton } from './ui/link-button'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Select } from './ui/select'
import { Spinner } from './ui/spinner'
import { ListRow } from '@/components/ui/list-row'

type Tag = { id: string; name: string; color?: string | null }

type Member = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  status: 'ACTIVE' | 'PASSIVE' | 'LEFT'
  tags?: Tag[]
  groups?: Array<{ id: string; name: string; type: 'GROUP' | 'COMMISSION'; color?: string | null }>
}

export function MemberSelectableList({ items, org, canWrite = true, q, status, selectedTags = [], tagsMode, selectedGroups = [], groupsMode, initialTemplateSlug }: { items: Member[]; org: string; canWrite?: boolean; q?: string; status?: string; selectedTags?: string[]; tagsMode?: 'or' | 'and'; selectedGroups?: string[]; groupsMode?: 'or' | 'and'; initialTemplateSlug?: string }) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [format, setFormat] = React.useState<'csv' | 'xlsx'>('csv')
  const [tags, setTags] = React.useState<Tag[]>([])
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string; type: 'GROUP' | 'COMMISSION' }>>([])
  const [selectedTag, setSelectedTag] = React.useState<string>('')
  const [selectedGroup, setSelectedGroup] = React.useState<string>('')
  const [tagMode, setTagMode] = React.useState<'or' | 'and'>('or')
  const [grpMode, setGrpMode] = React.useState<'or' | 'and'>('or')
  const allSelected = selected.length > 0 && selected.length === items.length
  const { add } = useToast()

  React.useEffect(() => {
    async function load() {
      try {
        const [rt, rg] = await Promise.all([
          fetch(`/api/${org}/members/tags`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
          fetch(`/api/${org}/members/groups`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
        ])
        setTags(rt.items || [])
        setGroups(rg.items || [])
      } catch {}
    }
    load()
  }, [org])

  const [templates, setTemplates] = React.useState<Array<{ slug: string; name: string }>>([])
  const [templateSlug, setTemplateSlug] = React.useState<string>(initialTemplateSlug || '')
  const [tplFormat, setTplFormat] = React.useState<'pdf' | 'docx'>('pdf')
  React.useEffect(() => {
    async function loadTpl() {
      try {
        const r = await fetch(`/api/${org}/templates`, { cache: 'no-store' })
        const d = await r.json().catch(() => ({ items: [] }))
        setTemplates((d.items || []).map((x: any) => ({ slug: x.slug, name: x.name })))
      } catch {}
    }
    loadTpl()
  }, [org])

  React.useEffect(() => {
    if (tagsMode) setTagMode(tagsMode)
  }, [tagsMode])
  React.useEffect(() => {
    if (groupsMode) setGrpMode(groupsMode)
  }, [groupsMode])

  function toggleAll() {
    setSelected((prev) => (prev.length === items.length ? [] : items.map((i) => i.id)))
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function exportSelected() {
    if (selected.length === 0) return add({ variant: 'error', title: 'Seçim yok', description: 'Lütfen en az bir üye seçin.' })
    const res = await fetch(`/api/${org}/members/export?format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      return add({ variant: 'error', title: 'Dışa aktarım hatası', description: data?.error ?? undefined })
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hazirun-${new Date().toISOString().slice(0,10)}.${format}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    add({ variant: 'success', title: 'Dosya indirildi' })
  }

  async function exportFiltered() {
    const res = await fetch(`/api/${org}/members/export?format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, status, tags: selectedTags, mode: tagMode, groups: selectedGroups, groupsMode: grpMode }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      return add({ variant: 'error', title: 'Dışa aktarım hatası', description: data?.error ?? undefined })
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hazirun-${new Date().toISOString().slice(0,10)}.${format}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    add({ variant: 'success', title: 'Dosya indirildi' })
  }

  async function pdfSelectedViaTemplate() {
    if (!templateSlug) return add({ variant: 'error', title: 'Şablon seçin' })
    if (selected.length === 0) return add({ variant: 'error', title: 'Seçim yok', description: 'Lütfen en az bir üye seçin.' })
    const res = await fetch(`/api/${org}/members/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateSlug, ids: selected, title: 'Hazirun', format: tplFormat }),
    })
    if (!res.ok) return add({ variant: 'error', title: 'PDF hatası' })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateSlug}-${new Date().toISOString().slice(0,10)}.${tplFormat}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function pdfFilteredViaTemplate() {
    if (!templateSlug) return add({ variant: 'error', title: 'Şablon seçin' })
    const res = await fetch(`/api/${org}/members/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateSlug, q, status, tags: selectedTags, tagsMode: tagMode, groups: selectedGroups, groupsMode: grpMode, title: 'Hazirun', format: tplFormat }),
    })
    if (!res.ok) return add({ variant: 'error', title: 'PDF hatası' })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateSlug}-${new Date().toISOString().slice(0,10)}.${tplFormat}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function assignOrUnassign(action: 'assign' | 'unassign') {
    if (!canWrite) return
    if (selected.length === 0) return add({ variant: 'error', title: 'Seçim yok', description: 'Lütfen en az bir üye seçin.' })
    if (!selectedTag) return add({ variant: 'error', title: 'Etiket seçilmedi', description: 'Lütfen bir etiket seçin.' })
    const res = await fetch(`/api/${org}/members/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: selected, tagId: selectedTag, action }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      add({ variant: 'error', title: 'Etiket güncellenemedi', description: data?.error ?? undefined })
    } else {
      add({ variant: 'success', title: action === 'assign' ? 'Etiket atandı' : 'Etiket kaldırıldı' })
    }
  }

  async function assignOrUnassignGroup(action: 'assign' | 'unassign') {
    if (!canWrite) return
    if (selected.length === 0) return add({ variant: 'error', title: 'Seçim yok', description: 'Lütfen en az bir üye seçin.' })
    if (!selectedGroup) return add({ variant: 'error', title: 'Grup seçilmedi', description: 'Lütfen bir grup seçin.' })
    const res = await fetch(`/api/${org}/members/groups`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: selected, groupId: selectedGroup, action }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      add({ variant: 'error', title: 'Grup güncellenemedi', description: data?.error ?? undefined })
    } else {
      add({ variant: 'success', title: action === 'assign' ? 'Grup atandı' : 'Gruptan çıkarıldı' })
    }
  }

  function buildTagToggleHref(tagId: string) {
    const nextTags = new Set(selectedTags)
    if (nextTags.has(tagId)) nextTags.delete(tagId)
    else nextTags.add(tagId)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    Array.from(nextTags).forEach((t) => params.append('tag', t))
    if (tagsMode) params.set('tagsMode', tagsMode)
    if (selectedGroups && selectedGroups.length) selectedGroups.forEach((g) => params.append('group', g))
    if (groupsMode) params.set('groupsMode', groupsMode)
    const qs = params.toString()
    return `/${org}/members${qs ? `?${qs}` : ''}`
  }

  function buildGroupToggleHref(groupId: string) {
    const nextGroups = new Set(selectedGroups)
    if (nextGroups.has(groupId)) nextGroups.delete(groupId)
    else nextGroups.add(groupId)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (selectedTags && selectedTags.length) selectedTags.forEach((t) => params.append('tag', t))
    if (tagsMode) params.set('tagsMode', tagsMode)
    Array.from(nextGroups).forEach((g) => params.append('group', g))
    if (groupsMode) params.set('groupsMode', groupsMode)
    const qs = params.toString()
    return `/${org}/members${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
    <div className="sticky top-16 z-20 mb-3 rounded-md border bg-card p-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={toggleAll} variant="outline">
            {allSelected ? 'Tümünü bırak' : 'Tümünü seç'}
          </Button>
      <Select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-[150px]">
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (XLSX)</option>
      </Select>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <Button type="button" onClick={exportSelected}>
            Seçiliyi indir
          </Button>
          <Button type="button" onClick={exportFiltered} variant="outline">
            Filtreyi indir
          </Button>
          <Button
            type="button"
            onClick={() => {
              const url = `/api/${org}/pdf/hazirun?take=500`
              window.open(url, '_blank')
            }}
            variant="outline"
          >
            Hazirun PDF
          </Button>
          <label className="ml-2 text-xs flex items-center gap-1">
            <span>Şablon:</span>
            <Select value={templateSlug} onChange={(e) => setTemplateSlug(e.target.value)} className="w-[200px] h-8">
            <option value="">Seçin…</option>
            {templates.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
            </Select>
          </label>
          <label className="ml-2 text-xs flex items-center gap-1">
            <span>Format:</span>
            <Select value={tplFormat} onChange={(e) => setTplFormat(e.target.value as any)} className="h-8 w-[120px]">
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            </Select>
          </label>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <Button type="button" onClick={pdfSelectedViaTemplate} variant="outline">Seçili PDF</Button>
          <Button type="button" onClick={pdfFilteredViaTemplate} variant="outline">Filtre PDF</Button>
          <label className="ml-2 text-xs flex items-center gap-1">
            <span>Tag modu:</span>
            <Select value={tagMode} onChange={(e) => setTagMode(e.target.value as any)} className="h-8 w-[120px]">
            <option value="or">OR</option>
            <option value="and">AND</option>
            </Select>
          </label>
          <label className="ml-2 text-xs flex items-center gap-1">
            <span>Grup modu:</span>
            <Select value={grpMode} onChange={(e) => setGrpMode(e.target.value as any)} className="h-8 w-[120px]">
            <option value="or">OR</option>
            <option value="and">AND</option>
            </Select>
          </label>
          <div className="text-sm text-muted-foreground">Seçili: {selected.length}</div>
          {canWrite && (
            <div className="ml-auto flex items-center gap-2">
              <Select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="w-[180px]">
              <option value="">Etiket seç</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              </Select>
              <Button type="button" onClick={() => assignOrUnassign('assign')} variant="outline">Ata</Button>
              <Button type="button" onClick={() => assignOrUnassign('unassign')} variant="outline">Kaldır</Button>
              <div className="h-5 w-px bg-border mx-1" />
              <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-[220px]">
              <option value="">Grup/Komisyon seç</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.type === 'COMMISSION' ? 'Komisyon' : 'Grup'})</option>
              ))}
              </Select>
              <Button type="button" onClick={() => assignOrUnassignGroup('assign')} variant="outline">Ata</Button>
              <Button type="button" onClick={() => assignOrUnassignGroup('unassign')} variant="outline">Kaldır</Button>
            </div>
          )}
        </div>
      </div>
      <ul className="divide-y rounded-md border bg-card">
        {items.map((m) => (
          <ListRow key={m.id} className="gap-3">
            <Checkbox checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
            <div className="flex-1">
              <div className="font-medium">
                <Link href={`/${org}/members/${m.id}`} className="underline-offset-2 hover:underline">{m.firstName} {m.lastName}</Link>
              </div>
              <div className="text-xs text-muted-foreground">{m.email ?? 'E-posta yok'} • {m.phone ?? 'Telefon yok'}</div>
              {Array.isArray(m.tags) && m.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <Link key={t.id} href={buildTagToggleHref(t.id)}>
                      <Badge variant="secondary" className="hover:opacity-80">{t.name}</Badge>
                    </Link>
                  ))}
                </div>
              )}
              {Array.isArray(m.groups) && m.groups.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.groups.map((g) => (
                    <Link key={g.id} href={buildGroupToggleHref(g.id)}>
                      <Badge className="hover:opacity-80" variant="outline">{g.name}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Badge variant={m.status === 'ACTIVE' ? 'secondary' : m.status === 'LEFT' ? 'destructive' : 'outline'} className="mr-3">
              {m.status}
            </Badge>
            {canWrite && <LinkButton href={`/${org}/members/${m.id}/edit`} size="sm" variant="outline">Düzenle</LinkButton>}
          </ListRow>
        ))}
      </ul>
    </div>
  )
}
