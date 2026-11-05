import { useState, type ReactNode } from 'react'
import { ChevronDown, Hash, ArrowLeft, ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DOC_SECTIONS } from '@/features/docs/docs-content'

type AvailabilityStatus = 'available' | 'next' | 'planned'

export function Availability({ status }: { status: AvailabilityStatus }) {
  const label =
    status === 'available' ? 'Available now' : status === 'next' ? 'Next up' : 'Planned'

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-[11px] px-2 py-0.5',
        status === 'available' &&
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-2xs',
        status === 'next' &&
          'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-2xs',
        status === 'planned' && 'bg-muted/60 text-muted-foreground',
      )}
    >
      {label}
    </Badge>
  )
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
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
    <div className="group relative rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xs p-5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {children}
          </p>
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
        <li key={step.title} className="flex gap-3.5 group">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-[0.7rem] font-bold text-primary transition-transform group-hover:scale-110">
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
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
    info: 'border-primary/20 bg-primary/5 text-primary',
    success: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    warning: 'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300',
    muted: 'border-border bg-muted/30 text-muted-foreground',
  } as const

  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5 shadow-xs', toneClasses[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
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
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-xs transition-all hover:border-border">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <Availability status={status} />
      </div>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function Faq({
  items,
}: {
  items: Array<{ question: string; answer: ReactNode }>
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-border/70 bg-card/70 px-5 py-3.5 shadow-xs transition-all open:border-primary/40 open:bg-card open:shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2.5">
            {item.answer}
          </div>
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
    <dl className="grid gap-3.5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term} className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs">
          <dt className="text-sm font-bold text-foreground text-primary">{item.term}</dt>
          <dd className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {item.definition}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function SectionHeading({
  id,
  index,
  title,
  description,
}: {
  id: string
  index: number
  title: string
  description: string
}) {
  const [copied, setCopied] = useState(false)

  const copyAnchor = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Anchor link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6 border-b border-border/70 pb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 group">
          <span className="font-mono text-xs font-bold tracking-widest text-primary">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={copyAnchor}
            aria-label="Copy section anchor link"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <Hash className={cn('size-4', copied && 'text-emerald-500')} />
          </button>
        </div>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function PrevNextNav({ currentId }: { currentId: string }) {
  const currentIndex = DOC_SECTIONS.findIndex((s) => s.id === currentId)
  if (currentIndex === -1) return null

  const prev = currentIndex > 0 ? DOC_SECTIONS[currentIndex - 1] : null
  const next = currentIndex < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[currentIndex + 1] : null

  return (
    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70 pt-6">
      {prev ? (
        <a
          href={`#${prev.id}`}
          className="w-full sm:w-auto flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-card hover:shadow-xs group"
        >
          <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Previous
            </span>
            <span className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
              {prev.label}
            </span>
          </div>
        </a>
      ) : (
        <div />
      )}

      {next ? (
        <a
          href={`#${next.id}`}
          className="w-full sm:w-auto flex items-center justify-end gap-2.5 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-right transition-all hover:border-primary/40 hover:bg-card hover:shadow-xs group ml-auto"
        >
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next
            </span>
            <span className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
              {next.label}
            </span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </a>
      ) : (
        <div />
      )}
    </div>
  )
}
