import type { ReactNode } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AvailabilityStatus = 'available' | 'next' | 'planned'

export function Availability({ status }: { status: AvailabilityStatus }) {
  const label =
    status === 'available' ? 'Available now' : status === 'next' ? 'Next up' : 'Planned'

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        status === 'available' &&
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        status === 'next' &&
          'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        status === 'planned' && 'bg-muted/50 text-muted-foreground',
      )}
    >
      {label}
    </Badge>
  )
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
        </div>
      </div>
    </div>
  )
}

export function Steps({
  steps,
}: {
  steps: Array<{ title: string; description: ReactNode }>
}) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-mono text-[0.68rem] font-semibold text-primary">
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Callout({
  icon: Icon,
  title,
  tone = 'info',
  children,
}: {
  icon: LucideIcon
  title: string
  tone?: 'info' | 'success' | 'warning' | 'muted'
  children: ReactNode
}) {
  const toneClasses = {
    info: 'border-primary/15 bg-primary/5 text-primary',
    success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300',
    muted: 'border-border bg-muted/30 text-muted-foreground',
  } as const

  return (
    <div className={cn('rounded-xl border p-4', toneClasses[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function RoadmapItem({
  title,
  description,
  status,
}: {
  title: string
  description: ReactNode
  status: 'next' | 'planned'
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Availability status={status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export function Faq({
  items,
}: {
  items: Array<{ question: string; answer: ReactNode }>
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border bg-card px-4 py-3 shadow-xs"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</div>
        </details>
      ))}
    </div>
  )
}

export function Glossary({
  items,
}: {
  items: Array<{ term: string; definition: ReactNode }>
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term} className="rounded-xl border bg-card p-4">
          <dt className="text-sm font-semibold text-foreground">{item.term}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {item.definition}
          </dd>
        </div>
      ))}
    </dl>
  )
}
