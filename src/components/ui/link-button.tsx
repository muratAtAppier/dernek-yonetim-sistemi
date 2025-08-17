import Link, { LinkProps } from 'next/link'
import { buttonVariants } from './button'
import { cn } from '@/lib/cn'

type LinkButtonProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
    className?: string
    children: React.ReactNode
  }

export function LinkButton({ href, children, className, variant, size, ...rest }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </Link>
  )
}
