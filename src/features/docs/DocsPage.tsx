import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Compass,
  Workflow,
  Target,
  ShieldCheck,
  Search,
} from 'lucide-react'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/lib/utils'
import {
  DOCS_UPDATED,
  DOC_SECTIONS,
  DOC_SECTION_LINKS,
  type DocsSection,
} from '@/features/docs/docs-content'
import { DocsHeader } from '@/features/docs/DocsHeader'
import { DocsToc, MobileDocsToc } from '@/features/docs/DocsToc'
import { useActiveSection } from '@/features/docs/useActiveSection'
import { DocsSearchModal } from '@/features/docs/DocsSearchModal'
import { SectionHeading, PrevNextNav } from '@/features/docs/docs-ui'

export type DocsMode = 'public' | 'app'

const HERO_TRACKS = [
  {
    icon: Compass,
    title: 'Quick Start Guide',
    description: 'From sign-in to your first verified opportunity in 5 minutes.',
    href: '#quick-start',
  },
  {
    icon: Workflow,
    title: 'Operating Loop',
    description: 'The continuous 5-stage pipeline: Discover to Review.',
    href: '#overview',
  },
  {
    icon: Target,
    title: 'Qualification Algorithm',
    description: 'Multi-factor match score breakdown and role evaluation.',
    href: '#opportunities',
  },
  {
    icon: ShieldCheck,
    title: 'Human Review Gates',
    description: 'Strict policy: zero autonomous sends without human sign-off.',
    href: '#ai-control',
  },
]

function DocsHero({
  mode,
  onOpenSearch,
}: {
  mode: DocsMode
  onOpenSearch?: () => void
}) {
  if (mode === 'app') {
    return (
      <section className="border-b border-border/70 bg-muted/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary">
              <BookOpen className="size-3" />
              Documentation
            </Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              Documentation
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              How the workspace fits together, what is available now, and what comes next.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSearch && (
              <Button variant="outline" size="sm" onClick={onOpenSearch} className="gap-1.5">
                <Search className="size-3.5" />
                <span>Search</span>
                <kbd className="font-mono text-[10px]">⌘K</kbd>
              </Button>
            )}
            <Button variant="outline" size="sm" render={<Link to="/app/dashboard" />}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-radial from-primary/5 via-background to-background">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        {/* Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary shadow-2xs">
            <BookOpen className="size-3" />
            Platform Documentation
          </Badge>
          <Badge variant="outline" className="border-border/80 bg-background/80 text-muted-foreground text-xs">
            Updated {DOCS_UPDATED}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            V1 + V2 Applications
          </span>
        </div>

        {/* Hero Title & Description */}
        <h1 className="mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Your job search,{' '}
          <span className="bg-gradient-to-r from-primary via-primary/80 to-foreground bg-clip-text text-transparent">
            running as a system.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
          Learn how Victor Job OS turns discovery, qualification, research, outreach, and
          applications into one cohesive loop — with strict, non-negotiable human review gates.
        </p>

        {/* Interactive Search Bar & Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex-1 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/90 px-4 py-3 text-sm text-muted-foreground shadow-xs backdrop-blur-md transition-all hover:border-primary/50 hover:bg-background hover:shadow-md hover:text-foreground group text-left"
            >
              <span className="flex items-center gap-2.5">
                <Search className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Search sections, prompts, or workflows...</span>
              </span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted px-2 font-mono text-[11px] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          )}

          <Button size="lg" className="rounded-2xl px-6 font-semibold shadow-sm hover:shadow-md transition-shadow" render={<Link to="/login" />}>
            Open Job OS
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Quick Jump Tracks */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_TRACKS.map((track) => {
            const Icon = track.icon
            return (
              <a
                key={track.title}
                href={track.href}
                className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-4 shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {track.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {track.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-80 group-hover:opacity-100">
                  <span>Explore topic</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DocsSectionBlock({
  section,
  index,
}: {
  section: DocsSection
  index: number
}) {
  return (
    <section id={section.id} className="scroll-mt-28">
      <SectionHeading
        id={section.id}
        index={index}
        title={section.title}
        description={section.description}
      />
      <div className="space-y-6">{section.content}</div>
      <PrevNextNav currentId={section.id} />
    </section>
  )
}

function DocsClosing({ mode }: { mode: DocsMode }) {
  const isApp = mode === 'app'

  return (
    <div className="mt-20 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-10 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-3" />
            Deterministic Operating System
          </Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Turn the documentation into momentum.
          </h2>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">
            Start with one opportunity, one application, or one follow-up. The system gets more
            powerful as the context becomes more complete.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg" className="rounded-full px-6" render={<Link to={isApp ? '/app/dashboard' : '/login'} />}>
            {isApp ? 'Back to dashboard' : 'Open Job OS'}
            <ArrowRight className="size-4" />
          </Button>
          {!isApp && (
            <Button size="lg" variant="outline" className="rounded-full px-5" render={<Link to="/" />}>
              Back to homepage
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function DocsPage({ mode = 'public' }: { mode?: DocsMode }) {
  const isApp = mode === 'app'
  const activeId = useActiveSection(DOC_SECTION_LINKS)
  const [searchOpen, setSearchOpen] = useState(false)

  // Listen for Cmd+K or Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  usePageMeta({
    title: 'Documentation — Victor Job OS',
    description:
      'Learn how Victor Job OS brings opportunity discovery, research, outreach, and application tracking into one workflow.',
    noindex: isApp,
    path: isApp ? '/app/docs' : '/docs',
  })

  const handleOpenSearch = () => setSearchOpen(true)

  const content = (
    <>
      <DocsHero mode={mode} onOpenSearch={handleOpenSearch} />
      <div
        className={cn(
          'mx-auto w-full px-4 pb-24 sm:px-6',
          isApp ? 'max-w-6xl' : 'max-w-7xl',
        )}
      >
        <div
          className={cn(
            'grid gap-10 mt-10',
            isApp
              ? 'xl:grid-cols-[240px_minmax(0,1fr)]'
              : 'lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-16',
          )}
        >
          <DocsToc
            sections={DOC_SECTION_LINKS}
            activeId={activeId}
            mode={mode}
            onOpenSearch={handleOpenSearch}
          />
          <article className="min-w-0">
            <MobileDocsToc
              sections={DOC_SECTION_LINKS}
              activeId={activeId}
              mode={mode}
              onOpenSearch={handleOpenSearch}
            />
            <div className="space-y-16">
              {DOC_SECTIONS.map((section, index) => (
                <DocsSectionBlock key={section.id} section={section} index={index} />
              ))}
            </div>
            <DocsClosing mode={mode} />
          </article>
        </div>
      </div>
      <DocsSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )

  if (isApp) {
    return <div className="flex min-h-full flex-col">{content}</div>
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <DocsHeader onOpenSearch={handleOpenSearch} />
      <main className="flex-1">{content}</main>
      <LandingFooter />
      <ScrollToTopButton />
    </div>
  )
}
