import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocsSection } from '@/features/docs/docs-content'
import { DOC_CATEGORIES } from '@/features/docs/DocsNavCategories'

type TocSection = Pick<DocsSection, 'id' | 'label'>

export function DocsToc({
  sections,
  activeId,
  mode = 'public',
  onOpenSearch,
}: {
  sections: TocSection[]
  activeId: string
  mode?: 'public' | 'app'
  onOpenSearch?: () => void
}) {
  // Map sections by id for fast lookup
  const sectionMap = new Map(sections.map((s) => [s.id, s]))

  return (
    <nav
      aria-label="On this page"
      className={cn(
        'hidden self-start pr-2',
        mode === 'public' ? 'lg:block' : 'xl:block',
        mode === 'public' ? 'sticky top-28' : 'sticky top-6',
      )}
    >
      {/* Quick Search Button in Sidebar */}
      {onOpenSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          className="mb-6 flex w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:text-foreground hover:shadow-xs group"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Search docs...</span>
          </span>
          <kbd className="inline-flex h-4.5 items-center gap-0.5 rounded border border-border/70 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Categorized TOC Navigation */}
      <div className="space-y-6">
        {DOC_CATEGORIES.map((category) => {
          const categorySections = category.sectionIds
            .map((id) => sectionMap.get(id))
            .filter((s): s is TocSection => s !== undefined)

          if (categorySections.length === 0) return null

          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-1.5 px-2">
                <category.icon className="size-3 text-muted-foreground/70" />
                <p className="text-[0.68rem] font-bold tracking-wider uppercase text-muted-foreground">
                  {category.label}
                </p>
              </div>

              <ul className="space-y-0.5 border-l border-border/70 ml-2">
                {categorySections.map((section) => {
                  const active = activeId === section.id
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        aria-current={active ? 'location' : undefined}
                        className={cn(
                          '-ml-px block border-l-2 py-1.5 pl-3.5 text-xs font-medium transition-all duration-150',
                          active
                            ? 'border-primary font-bold text-foreground bg-primary/5 rounded-r-md'
                            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                        )}
                      >
                        {section.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileDocsToc({
  sections,
  activeId,
  mode = 'public',
  onOpenSearch,
}: {
  sections: TocSection[]
  activeId: string
  mode?: 'public' | 'app'
  onOpenSearch?: () => void
}) {
  return (
    <div
      className={cn(
        'mb-8 rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-xs',
        mode === 'public' ? 'lg:hidden' : 'xl:hidden',
      )}
    >
      <div className="flex items-center justify-between pb-2">
        <p className="px-1 text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
          Table of Contents
        </p>
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3" />
            <span>Search</span>
            <kbd className="font-mono text-[10px]">⌘K</kbd>
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {sections.map((section) => {
          const active = activeId === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                active
                  ? 'border-primary/40 bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'border-border/70 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted',
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
