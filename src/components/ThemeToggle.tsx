'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from './ui/button'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored ? stored === 'dark' : prefersDark
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  function toggle() {
    const next = !(isDark ?? false)
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <Button variant="ghost" size="sm" aria-label="Tema" onClick={toggle} title="Tema">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
