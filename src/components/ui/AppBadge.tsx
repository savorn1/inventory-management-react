import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger'

const cls: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger:  'bg-red-100 text-red-700',
}

interface Props {
  variant: BadgeVariant
  children: ReactNode
}

export function AppBadge({ variant, children }: Props) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls[variant]}`}>
      {children}
    </span>
  )
}
