"use client"

import { useEffect, useRef } from 'react'
import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
}

// Simple IntersectionObserver-based reveal wrapper
export default function Reveal({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.remove('reveal-hidden')
              el.classList.add('reveal-show')
              obs.disconnect()
            }
          })
        },
        { threshold: 0.2 }
      )
      obs.observe(el)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div ref={ref} className={clsx('reveal-hidden', className)}>
      {children}
    </div>
  )
}
