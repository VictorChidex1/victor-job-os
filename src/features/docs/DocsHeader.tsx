import { Link } from 'react-router'
import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
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

        <span className="hidden h-5 w-px bg-border sm:block" />

        <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
          <BookOpen className="size-3" />
          Documentation
        </Badge>

        <nav className="ml-auto flex items-center gap-1" aria-label="Documentation navigation">
          <Link
            to="/"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground')}
          >
            Home
          </Link>
          <Link
            to="/docs"
            aria-current="page"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'bg-muted text-foreground',
            )}
          >
            Docs
          </Link>
          <Button size="sm" className="ml-1 rounded-full px-4" render={<Link to="/login" />}>
            <span className="hidden sm:inline">Open Job OS</span>
            <span className="sm:hidden">Open</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
