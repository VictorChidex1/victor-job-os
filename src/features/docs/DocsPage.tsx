import { Link } from 'react-router'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
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

export type DocsMode = 'public' | 'app'

function DocsHero({ mode }: { mode: DocsMode }) {
  if (mode === 'app') {
    return (
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Badge variant="outline" className="gap-1.5 bg-background/80">
              <BookOpen className="size-3" />
              Documentation
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Documentation
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              How the workspace fits together, what is available now, and what comes next.
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link to="/app/dashboard" />}>
            Back to dashboard
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden border-b bg-muted/30">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <Badge variant="outline" className="gap-1.5 bg-background/80">
          <BookOpen className="size-3" />
          Documentation
        </Badge>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Your job search, documented.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Learn how Victor Job OS turns discovery, qualification, research, outreach, and
          applications into one operating workflow — and where the human review gates sit.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" render={<a href="#overview" />}>
            Start with the overview
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<Link to="/login" />}>
            Open Job OS
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-background/70">
            Updated {DOCS_UPDATED}
          </Badge>
          <Badge variant="outline" className="bg-background/70">
            V1 + V2 applications
          </Badge>
          <span>Public guide</span>
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
    <section id={section.id} className="scroll-mt-24">
      <div className="mb-5 border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] font-semibold tracking-widest text-primary">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {section.title}
          </h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {section.description}
        </p>
      </div>
      <div className="space-y-5">{section.content}</div>
    </section>
  )
}

function DocsClosing({ mode }: { mode: DocsMode }) {
  const isApp = mode === 'app'

  return (
    <div className="mt-16 rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Badge variant="outline" className="gap-1.5 bg-background/70">
            <Sparkles className="size-3" />
            Keep building
          </Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Turn the documentation into action.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Start with one opportunity, one application, or one follow-up. The system gets more
            useful as the context becomes more complete.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link to={isApp ? '/app/dashboard' : '/login'} />}>
            {isApp ? 'Back to dashboard' : 'Open Job OS'}
            <ArrowRight />
          </Button>
          {!isApp && (
            <Button variant="outline" render={<Link to="/" />}>
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

  usePageMeta({
    title: 'Documentation — Victor Job OS',
    description:
      'Learn how Victor Job OS brings opportunity discovery, research, outreach, and application tracking into one workflow.',
    noindex: isApp,
    path: isApp ? '/app/docs' : '/docs',
  })

  const content = (
    <>
      <DocsHero mode={mode} />
      <div
        className={cn(
          'mx-auto w-full px-4 pb-20 sm:px-6',
          isApp ? 'max-w-6xl' : 'max-w-7xl',
        )}
      >
        <div
          className={cn(
            'grid gap-10',
            isApp
              ? 'xl:grid-cols-[200px_minmax(0,1fr)]'
              : 'lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-16',
          )}
        >
          <DocsToc sections={DOC_SECTION_LINKS} activeId={activeId} mode={mode} />
          <article className="min-w-0">
            <MobileDocsToc sections={DOC_SECTION_LINKS} activeId={activeId} mode={mode} />
            <div className="space-y-14">
              {DOC_SECTIONS.map((section, index) => (
                <DocsSectionBlock key={section.id} section={section} index={index} />
              ))}
            </div>
            <DocsClosing mode={mode} />
          </article>
        </div>
      </div>
    </>
  )

  if (isApp) {
    return <div className="flex min-h-full flex-col">{content}</div>
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <DocsHeader />
      <main className="flex-1">{content}</main>
      <LandingFooter />
      <ScrollToTopButton />
    </div>
  )
}
