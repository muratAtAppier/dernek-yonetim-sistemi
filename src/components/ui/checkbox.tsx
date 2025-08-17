import * as React from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn('h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-2', className)}
      {...props}
    />
  )
})
Checkbox.displayName = 'Checkbox'

export { Checkbox }
