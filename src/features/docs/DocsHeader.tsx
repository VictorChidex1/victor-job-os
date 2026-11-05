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
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src="/assets/victor-job-os.png"
              alt="Victor Job OS logo"
              className="size-7 sm:size-8 shrink-0 rounded-md object-contain"
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

        {/* Center: Search Trigger (Responsive) */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 p-2 sm:px-3.5 sm:py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/70 hover:text-foreground shadow-2xs group"
          >
            <Search className="size-4 sm:size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="hidden md:inline">Search docs, prompts & architecture...</span>
            <span className="hidden sm:inline md:hidden">Search docs...</span>
            <kbd className="hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Right Navigation */}
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0" aria-label="Documentation navigation">
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground',
            )}
          >
            Home
          </Link>
          <Link
            to="/docs"
            aria-current="page"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'px-2 sm:px-3 text-xs sm:text-sm bg-primary/10 text-primary font-semibold',
            )}
          >
            Docs
          </Link>
          <Button
            size="sm"
            className="ml-0.5 rounded-full px-3 sm:px-4.5 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            render={<Link to="/login" />}
          >
            <span>Open</span>
            <span className="hidden sm:inline">&nbsp;Job OS</span>
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
