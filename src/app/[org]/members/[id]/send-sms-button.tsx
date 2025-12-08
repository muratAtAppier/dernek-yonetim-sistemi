'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { SMS_TEMPLATES } from '@/lib/sms/templates'

interface Props {
  org: string
  memberId: string
  phone?: string | null
}

export const SendSmsButton: React.FC<Props> = ({ org, memberId, phone }) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const { add } = useToast()

  const disabled = !phone

  // Handle template selection
  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId)
    if (templateId) {
      const template = SMS_TEMPLATES.find((t) => t.id === templateId)
      if (template) {
        setMessage(template.content)
      }
    }
  }

  async function send() {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/${org}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, memberIds: [memberId] }),
      })
      if (res.ok) {
        add({ variant: 'success', title: 'SMS gönderildi' })
        setOpen(false)
        setMessage('')
      } else {
        const data = await res.json().catch(() => null)
        add({
          variant: 'error',
          title: 'SMS gönderilemedi',
          description: data?.error,
        })
      }
    } catch (e: any) {
      add({ variant: 'error', title: 'Ağ hatası', description: e?.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Sms Gönder
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded border bg-card shadow-lg">
            <div className="border-b px-4 py-2 font-medium">SMS Gönder</div>
            <div className="p-4 space-y-3">
              {!phone && (
                <p className="text-sm text-red-600">
                  Bu üyeye ait telefon numarası yok.
                </p>
              )}
              {/* Template Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  SMS Şablonu (Opsiyonel)
                </label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm bg-background"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">-- Şablon Seçin --</option>
                  {SMS_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {
                      SMS_TEMPLATES.find((t) => t.id === selectedTemplate)
                        ?.description
                    }
                  </p>
                )}
              </div>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={5}
                placeholder="Mesajınızı yazın..."
                value={message}
                maxLength={612}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{message.length} / 612</span>
                <span>{Math.ceil(message.length / 153) || 1} SMS</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={send}
                  disabled={sending || !message.trim() || !phone}
                >
                  {sending ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SendSmsButton
