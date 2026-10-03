import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { navGroups } from '@/components/layout/nav-config'

interface MobileNavigationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNavigation({ open, onOpenChange }: MobileNavigationProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Victor&apos;s Job OS</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Mobile navigation">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1.5 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'w-full min-w-0 justify-start gap-2.5 overflow-hidden',
                        )}
                      >
                        <Icon className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}