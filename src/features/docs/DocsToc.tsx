import { cn } from '@/lib/utils'
import type { DocsSection } from '@/features/docs/docs-content'

type TocSection = Pick<DocsSection, 'id' | 'label'>

export function DocsToc({
  sections,
  activeId,
  mode = 'public',
}: {
  sections: TocSection[]
  activeId: string
  mode?: 'public' | 'app'
}) {
  return (
    <nav
      aria-label="On this page"
      className={cn(
        'hidden self-start',
        mode === 'public' ? 'lg:block' : 'xl:block',
        mode === 'public' ? 'sticky top-24' : 'sticky top-6',
      )}
    >
      <p className="text-[0.68rem] font-semibold tracking-widest text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="mt-3 border-l border-border/70">
        {sections.map((section) => {
          const active = activeId === section.id
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l py-1.5 pl-4 text-sm transition-colors',
                  active
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileDocsToc({
  sections,
  activeId,
  mode = 'public',
}: {
  sections: TocSection[]
  activeId: string
  mode?: 'public' | 'app'
}) {
  return (
    <div
      className={cn(
        'mb-8 rounded-xl border bg-muted/20 p-3',
        mode === 'public' ? 'lg:hidden' : 'xl:hidden',
      )}
    >
      <p className="px-1 text-[0.68rem] font-semibold tracking-widest text-muted-foreground uppercase">
        On this page
      </p>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {sections.map((section) => {
          const active = activeId === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-border/70 bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {section.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}
