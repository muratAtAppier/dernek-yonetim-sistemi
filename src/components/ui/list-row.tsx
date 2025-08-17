import * as React from 'react'
import { cn } from '@/lib/cn'

type ListRowProps = React.PropsWithChildren<{
  className?: string
}>

export function ListRow({ className, children }: ListRowProps) {
  return (
    <li className={cn('p-3 flex items-center justify-between hover:bg-accent/50 transition-colors', className)}>
      {children}
    </li>
  )
}
