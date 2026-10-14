import { Link } from 'react-router'
import { Home, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { navGroups } from '@/components/layout/nav-config'
import { signOutUser } from '@/services/auth'

interface MobileNavigationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNavigation({ open, onOpenChange }: MobileNavigationProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 gap-0 p-0">
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
        <div className="shrink-0 space-y-1 border-t p-2">
          <Link
            to="/"
            onClick={() => onOpenChange(false)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start gap-2.5',
            )}
          >
            <Home className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">Back to home</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              void signOutUser()
            }}
            className="w-full justify-start gap-2.5 text-destructive hover:text-destructive"
          >
            <LogOut className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">Sign out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
