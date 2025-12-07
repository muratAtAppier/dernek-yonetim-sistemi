'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

type MemberLite = {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
}

type BoardMember = {
  role:
    | 'PRESIDENT'
    | 'VICE_PRESIDENT'
    | 'SECRETARY'
    | 'TREASURER'
    | 'MEMBER'
    | 'SUPERVISOR'
  memberType: 'ASIL' | 'YEDEK'
  order: number
  member: MemberLite
}

type BoardData = {
  id: string
  type: 'EXECUTIVE' | 'AUDIT'
  name: string
  description?: string | null
  terms: Array<{
    id: string
    name?: string | null
    startDate: string
    endDate?: string | null
    isActive: boolean
    members: BoardMember[]
  }>
}

const ROLE_NAMES: Record<string, string> = {
  PRESIDENT: 'Yönetim Kurulu Başkanı',
  VICE_PRESIDENT: 'Yönetim Kurulu Başkan Yardımcısı',
  SECRETARY: 'Sekreter',
  TREASURER: 'Sayman',
  SUPERVISOR: 'Denetim Kurulu Başkanı',
  MEMBER: 'Üye',
}

export function BoardDetailClient({
  org,
  boardId,
  boardType,
  boardName,
  canWrite = false,
  initialBoard,
}: {
  org: string
  boardId: string
  boardType: 'EXECUTIVE' | 'AUDIT'
  boardName?: string
  canWrite?: boolean
  initialBoard: BoardData
}) {
  const { add } = useToast()
  const [board, setBoard] = React.useState<BoardData>(initialBoard)
  const [isEditing, setIsEditing] = React.useState(false)
  const [memberSearch, setMemberSearch] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<MemberLite[]>([])
  const [editingMembers, setEditingMembers] = React.useState<BoardMember[]>([])
  const [loading, setLoading] = React.useState(false)

  const activeTerm = board.terms?.[0]
  const members = activeTerm?.members || []
  const asilMembers = members.filter((m) => m.memberType === 'ASIL')
  const yedekMembers = members.filter((m) => m.memberType === 'YEDEK')

  async function refreshBoard() {
    try {
      const res = await fetch(`/api/${org}/boards/${boardId}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setBoard(data.item || initialBoard)
      }
    } catch {}
  }

  async function searchMembers() {
    const q = memberSearch.trim()
    if (!q) {
      setSearchResults([])
      return
    }
    const params = new URLSearchParams({ q, take: '50' })
    const res = await fetch(`/api/${org}/members?${params.toString()}`, {
      cache: 'no-store',
    })
    const data = res.ok ? await res.json() : { items: [] }
    setSearchResults((data.items || []) as MemberLite[])
  }

  function startEditing() {
    setEditingMembers(
      members.map((m) => ({
        role: m.role,
        memberType: m.memberType,
        order: m.order,
        member: m.member,
      }))
    )
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditingMembers([])
    setMemberSearch('')
    setSearchResults([])
  }

  function addMember(m: MemberLite) {
    if (editingMembers.some((e) => e.member.id === m.id)) return
    const maxOrder = editingMembers.reduce(
      (a, b) => Math.max(a, b.order || 0),
      0
    )
    setEditingMembers([
      ...editingMembers,
      { role: 'MEMBER', memberType: 'ASIL', order: maxOrder + 1, member: m },
    ])
    setSearchResults([])
    setMemberSearch('')
  }

  function removeMember(memberId: string) {
    setEditingMembers(editingMembers.filter((e) => e.member.id !== memberId))
  }

  function changeRole(memberId: string, role: BoardMember['role']) {
    setEditingMembers(
      editingMembers.map((e) =>
        e.member.id === memberId
          ? {
              ...e,
              role,
              memberType: role === 'MEMBER' ? e.memberType : 'ASIL',
            }
          : e
      )
    )
  }

  function changeMemberType(
    memberId: string,
    memberType: BoardMember['memberType']
  ) {
    setEditingMembers(
      editingMembers.map((e) =>
        e.member.id === memberId ? { ...e, memberType } : e
      )
    )
  }

  async function saveMembers() {
    if (!canWrite || !activeTerm) return
    setLoading(true)
    try {
      const items = editingMembers.map(
        ({ role, memberType, order, member }, idx) => ({
          memberId: member.id,
          role,
          memberType,
          order: order || idx + 1,
        })
      )

      const res = await fetch(`/api/${org}/boards/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId: activeTerm.id, items, replace: true }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => null)

        // Handle validation errors
        if (d?.validationErrors && Array.isArray(d.validationErrors)) {
          const errorMessages = d.validationErrors
            .map((err: any) => err.message)
            .join('\n')
          return add({
            variant: 'error',
            title: 'Kurul gereksinimleri karşılanmadı',
            description: errorMessages,
          })
        }

        return add({
          variant: 'error',
          title: 'Üyeler kaydedilemedi',
          description: d?.error || d?.conflictingMember || 'Bir hata oluştu',
        })
      }

      add({ variant: 'success', title: 'Üyeler güncellendi' })
      await refreshBoard()
      setIsEditing(false)
      setEditingMembers([])
    } catch (e: any) {
      add({ variant: 'error', title: 'Hata', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const minAsil = boardType === 'EXECUTIVE' ? 5 : 3
  const minYedek = boardType === 'EXECUTIVE' ? 5 : 3

  if (!activeTerm) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Bu kurul için aktif dönem bulunamadı.
          </p>
          {canWrite && (
            <p className="text-xs text-muted-foreground">
              Lütfen önce bir dönem oluşturun.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{boardName}</h2>
          <p className="text-sm text-muted-foreground">
            {activeTerm.name || 'Mevcut Dönem'}
          </p>
        </div>
        {canWrite && !isEditing && (
          <Button onClick={startEditing} size="sm">
            Üye Ekle / Düzenle
          </Button>
        )}
      </div>

      {/* Requirements Summary */}
      <div className="bg-muted/50 rounded-md p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Asil Üye:</span>
          <span
            className={`font-medium ${
              asilMembers.length >= minAsil
                ? 'text-green-600'
                : 'text-amber-600'
            }`}
          >
            {asilMembers.length} / {minAsil}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Yedek Üye:</span>
          <span
            className={`font-medium ${
              yedekMembers.length >= minYedek
                ? 'text-green-600'
                : 'text-amber-600'
            }`}
          >
            {yedekMembers.length} / {minYedek}
          </span>
        </div>
      </div>

      {/* View Mode */}
      {!isEditing && (
        <div className="space-y-4">
          {/* Asil Members */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Asil Üyeler
            </h3>
            <div className="space-y-2">
              {asilMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Henüz asil üye eklenmedi
                </p>
              ) : (
                asilMembers.map((m) => (
                  <div
                    key={m.member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <Link
                        href={`/${org}/members/${m.member.id}`}
                        className="font-medium hover:underline"
                      >
                        {m.member.firstName} {m.member.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_NAMES[m.role] || m.role}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Yedek Members */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Yedek Üyeler
            </h3>
            <div className="space-y-2">
              {yedekMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Henüz yedek üye eklenmedi
                </p>
              ) : (
                yedekMembers.map((m) => (
                  <div
                    key={m.member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <Link
                        href={`/${org}/members/${m.member.id}`}
                        className="font-medium hover:underline"
                      >
                        {m.member.firstName} {m.member.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_NAMES[m.role] || m.role}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          {/* Member Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Üye Ara ve Ekle</label>
            <div className="flex gap-2">
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMembers()}
                placeholder="İsim veya email ara..."
                className="flex-1"
              />
              <Button onClick={searchMembers} variant="outline">
                Ara
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addMember(m)}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  >
                    {m.firstName} {m.lastName}
                    {m.email && (
                      <span className="text-muted-foreground ml-2">
                        ({m.email})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editing Members List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Kurul Üyeleri ({editingMembers.length})
            </label>
            {editingMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Henüz üye eklenmedi
              </p>
            ) : (
              <div className="space-y-2">
                {editingMembers.map((m) => (
                  <div
                    key={m.member.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {m.member.firstName} {m.member.lastName}
                      </p>
                    </div>
                    <select
                      value={m.role}
                      onChange={(e) =>
                        changeRole(m.member.id, e.target.value as any)
                      }
                      className="text-sm border rounded px-2 py-1"
                    >
                      {boardType === 'EXECUTIVE' && (
                        <>
                          <option value="PRESIDENT">Başkan</option>
                          <option value="VICE_PRESIDENT">Başkan Yrd.</option>
                          <option value="SECRETARY">Sekreter</option>
                          <option value="TREASURER">Sayman</option>
                          <option value="MEMBER">Üye</option>
                        </>
                      )}
                      {boardType === 'AUDIT' && (
                        <>
                          <option value="SUPERVISOR">Başkan</option>
                          <option value="MEMBER">Üye</option>
                        </>
                      )}
                    </select>
                    {m.role === 'MEMBER' && (
                      <select
                        value={m.memberType}
                        onChange={(e) =>
                          changeMemberType(m.member.id, e.target.value as any)
                        }
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="ASIL">Asil</option>
                        <option value="YEDEK">Yedek</option>
                      </select>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMember(m.member.id)}
                    >
                      Çıkar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={saveMembers} disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button
              onClick={cancelEditing}
              variant="outline"
              disabled={loading}
            >
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
