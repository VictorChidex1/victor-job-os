import { Link } from 'react-router'
import { BookOpen, Search } from 'lucide-react'
import { motion, useScroll } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DocsHeader({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { scrollYProgress } = useScroll()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src="/assets/victor-job-os.png"
              alt="Victor Job OS logo"
              className="size-8 shrink-0 rounded-md object-contain"
            />
            <span className="hidden truncate text-sm font-bold tracking-tight text-foreground sm:inline">
              Victor Job OS
            </span>
          </Link>

          <span className="hidden h-5 w-px bg-border/80 sm:block" />

          <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex border-primary/20 bg-primary/5 text-primary">
            <BookOpen className="size-3" />
            Documentation
          </Badge>
        </div>

        {/* Center / Action Search Trigger */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 rounded-full border border-border/70 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/70 hover:text-foreground shadow-2xs group"
          >
            <Search className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden md:inline">Search docs, prompts & architecture...</span>
            <span className="md:hidden">Search docs...</span>
            <kbd className="hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Right Navigation */}
        <nav className="flex items-center gap-1.5" aria-label="Documentation navigation">
          <Link
            to="/"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground')}
          >
            Home
          </Link>
          <Link
            to="/docs"
            aria-current="page"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'bg-primary/10 text-primary font-semibold',
            )}
          >
            Docs
          </Link>
          <Button size="sm" className="ml-1 rounded-full px-4.5 font-medium shadow-sm hover:shadow-md transition-shadow" render={<Link to="/login" />}>
            <span className="hidden sm:inline">Open Job OS</span>
            <span className="sm:hidden">Open</span>
          </Button>
        </nav>
      </div>

      {/* Reading Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary origin-left z-50 shadow-xs shadow-primary/50"
        style={{ scaleX: scrollYProgress }}
      />
    </header>
  )
}
