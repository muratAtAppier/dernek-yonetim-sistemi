"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function MeetingsClient({ org, canWrite, initialItems }: { org: string; canWrite: boolean; initialItems: any[] }) {
  const [items, setItems] = useState(initialItems)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<'GENERAL_ASSEMBLY'|'BOARD'|'COMMISSION'|'OTHER'>('OTHER')

  async function create() {
    if (!canWrite) return
    const res = await fetch(`/api/${org}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduledAt: date, type })
    })
    if (res.ok) {
      const { item } = await res.json()
      setItems([item, ...items])
      setTitle('')
      setDate('')
      setType('OTHER')
    }
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <Input placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value as any)}>
              <option value="GENERAL_ASSEMBLY">Genel Kurul</option>
              <option value="BOARD">Kurul</option>
              <option value="COMMISSION">Komisyon</option>
              <option value="OTHER">Diğer</option>
            </Select>
            <Button onClick={create}>Oluştur</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-2">
        {items.map((m) => (
          <Link key={m.id} href={`/${org}/meetings/${m.id}`} className="block">
            <Card className="p-4 flex items-center justify-between hover:bg-accent/40">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(m.scheduledAt).toLocaleString()} • {m.type}</div>
              </div>
              <div className="text-xs">{m.status}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
