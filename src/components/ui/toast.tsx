"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

type ToastContextValue = {
  add: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, variant: 'default', duration: 4000, ...t }
    setToasts((prev) => [...prev, toast])
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ add }), [add])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'min-w-[260px] max-w-[360px] rounded-md border bg-card px-3 py-2 shadow text-sm',
            t.variant === 'success' ? 'border-green-300 text-green-800 bg-green-50 dark:bg-green-900/20 dark:text-green-200' : '',
            t.variant === 'error' ? 'border-red-300 text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-200' : '',
            t.variant === 'warning' ? 'border-yellow-300 text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-100' : '',
          ].join(' ')}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-medium">{t.title}</div>}
              {t.description && <div>{t.description}</div>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-xs text-muted-foreground hover:text-foreground">Kapat</button>
          </div>
        </div>
      ))}
    </div>
  )
}
