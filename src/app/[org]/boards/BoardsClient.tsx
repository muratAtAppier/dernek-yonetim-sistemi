'use client'

import React from 'react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export type Board = {
  id: string
  type: 'EXECUTIVE' | 'AUDIT'
  name: string
  description?: string | null
  terms?: Array<{
    id: string
    name?: string | null
    isActive: boolean
    startDate: string
    endDate?: string | null
    members: Array<{
      member: { id: string; firstName: string; lastName: string }
      memberType?: 'ASIL' | 'YEDEK'
      role?: string
    }>
  }>
}

export function BoardsClient({
  org,
  canWrite,
  initialItems,
}: {
  org: string
  canWrite: boolean
  initialItems: Board[]
}) {
  const [items, setItems] = React.useState<Board[]>(initialItems)
  const [loading, setLoading] = React.useState(false)
  const { add } = useToast()

  const executiveBoard = items.find((b) => b.type === 'EXECUTIVE')
  const auditBoard = items.find((b) => b.type === 'AUDIT')

  async function refresh() {
    try {
      const res = await fetch(`/api/${org}/boards`)
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items || [])
    } catch {}
  }

  async function createBoard(type: 'EXECUTIVE' | 'AUDIT') {
    if (!canWrite) return
    setLoading(true)
    try {
      const name = type === 'EXECUTIVE' ? 'Yönetim Kurulu' : 'Denetim Kurulu'
      const res = await fetch(`/api/${org}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return add({
          variant: 'error',
          title: 'Kurul eklenemedi',
          description: data?.error,
        })
      }
      await refresh()
      add({ variant: 'success', title: 'Kurul oluşturuldu' })
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const BoardCard = ({
    board,
    type,
    title,
    requiredRoles,
  }: {
    board?: Board
    type: 'EXECUTIVE' | 'AUDIT'
    title: string
    requiredRoles: Array<{ label: string; key: string }>
  }) => {
    const activeTerm = board?.terms?.[0]
    const members = activeTerm?.members || []
    const asilMembers = members.filter((m) => m.memberType === 'ASIL')
    const yedekMembers = members.filter((m) => m.memberType === 'YEDEK')
    const minAsil = type === 'EXECUTIVE' ? 5 : 3
    const minYedek = type === 'EXECUTIVE' ? 5 : 3
    const isComplete =
      asilMembers.length >= minAsil && yedekMembers.length >= minYedek

    // Helper function to check if a role is assigned
    const getRoleAssignment = (roleKey: string) => {
      const member = members.find((m) => {
        if (roleKey === 'PRESIDENT') return m.role === 'PRESIDENT'
        if (roleKey === 'VICE_PRESIDENT') return m.role === 'VICE_PRESIDENT'
        if (roleKey === 'SECRETARY') return m.role === 'SECRETARY'
        if (roleKey === 'TREASURER') return m.role === 'TREASURER'
        if (roleKey === 'SUPERVISOR') return m.role === 'SUPERVISOR'
        return false
      })
      return member
        ? `${member.member.firstName} ${member.member.lastName}`
        : null
    }

    return (
      <div className="rounded-lg border bg-card shadow-sm flex flex-col h-full">
        <div className="border-b bg-muted/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{title}</h2>
            {board && !isComplete && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                Eksik
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 flex flex-col">
          {!board ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {title} henüz oluşturulmamış
              </p>
              {canWrite && (
                <Button onClick={() => createBoard(type)} disabled={loading}>
                  {title} Oluştur
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Required Roles */}
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Gerekli Roller:
                </h3>
                <div className="grid gap-2">
                  {requiredRoles.map((role) => {
                    const assignedTo = getRoleAssignment(role.key)
                    return (
                      <div
                        key={role.key}
                        className="text-sm flex items-center justify-between py-1"
                      >
                        <span>{role.label}</span>
                        {assignedTo ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-300"
                          >
                            ✓ {assignedTo}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 border-amber-300"
                          >
                            Atanmadı
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Asil Üye:</span>
                  <span
                    className={`font-medium ${asilMembers.length >= minAsil ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {asilMembers.length} / {minAsil}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Yedek Üye:</span>
                  <span
                    className={`font-medium ${yedekMembers.length >= minYedek ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {yedekMembers.length} / {minYedek}
                  </span>
                </div>
              </div>

              {/* Current Members Preview */}
              {members.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Mevcut Üyeler:
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {members.slice(0, 6).map((m) => (
                      <Badge
                        key={m.member.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {m.member.firstName} {m.member.lastName}
                      </Badge>
                    ))}
                    {members.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{members.length - 6} daha
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 mt-auto">
                <Link href={`/${org}/boards/${board.id}`} className="block">
                  <Button
                    className="w-full"
                    variant={isComplete ? 'outline' : 'default'}
                  >
                    {members.length === 0 ? 'Üye Ekle' : 'Üyeleri Yönet'} →
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome message if no boards */}
      {items.length === 0 && canWrite && (
        <div className="rounded-lg border-2 border-dashed bg-muted/50 p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Kurulları Oluşturun</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Derneğinizin Yönetim Kurulu ve Denetim Kurulu'nu oluşturmak için
            aşağıdaki kartlardaki butonları kullanın. Kurulları oluşturduktan
            sonra üyeleri atayabilirsiniz.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <BoardCard
          board={executiveBoard}
          type="EXECUTIVE"
          title="Yönetim Kurulu"
          requiredRoles={[
            { label: 'Yönetim Kurulu Başkanı', key: 'PRESIDENT' },
            {
              label: 'Yönetim Kurulu Başkan Yardımcısı',
              key: 'VICE_PRESIDENT',
            },
            { label: 'Sekreter', key: 'SECRETARY' },
            { label: 'Sayman', key: 'TREASURER' },
          ]}
        />

        <BoardCard
          board={auditBoard}
          type="AUDIT"
          title="Denetim Kurulu"
          requiredRoles={[
            { label: 'Denetim Kurulu Başkanı', key: 'SUPERVISOR' },
          ]}
        />
      </div>

      {/* Additional info */}
      {canWrite && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Bilgi:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>
              Her kurul için önce üyeleri ekleyin, ardından rollerini atayın
            </li>
            <li>Yönetim Kurulu minimum 5 asil + 5 yedek üye içermelidir</li>
            <li>Denetim Kurulu minimum 3 asil + 3 yedek üye içermelidir</li>
            <li>Aynı rol birden fazla kişiye atanamaz</li>
          </ul>
        </div>
      )}
    </div>
  )
}
