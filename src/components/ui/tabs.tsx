'use client'

import * as React from 'react'
import clsx from 'clsx'

export type Tab = { id: string; label: React.ReactNode; disabled?: boolean }

export function Tabs({ tabs, value, onChange, className }: { tabs: Tab[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-1 overflow-x-auto', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => !t.disabled && onChange(t.id)}
          disabled={t.disabled}
          className={clsx(
            'rounded-sm px-3 py-1.5 text-sm transition-colors border',
            value === t.id ? 'bg-accent text-accent-foreground border-border' : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent',
            t.disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function TabPanel({ active, children, className }: { active: boolean; children: React.ReactNode; className?: string }) {
  if (!active) return null
  return <div className={clsx('mt-3', className)}>{children}</div>
}
