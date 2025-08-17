import * as React from 'react'
import { cn } from '@/lib/cn'

function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' | 'destructive' }) {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors'
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
  } as const
  return <span className={cn(base, variants[variant], className)} {...props} />
}

export { Badge }
