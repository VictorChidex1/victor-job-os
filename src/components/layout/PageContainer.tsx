import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  /** Stack the title and actions vertically even on wide viewports. */
  stackHeader?: boolean
}

export function PageContainer({
  title,
  description,
  actions,
  children,
  stackHeader = false,
}: PageContainerProps) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div
        className={cn(
          'flex flex-col gap-3',
          !stackHeader && 'sm:flex-row sm:items-start sm:justify-between',
        )}
      >
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}
