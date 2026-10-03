import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navGroups } from '@/components/layout/nav-config'

interface AppSidebarProps {
  collapsed?: boolean
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside
      data-collapsed={collapsed}
      className="flex h-full w-60 shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 data-collapsed:w-14"
    >
      <div className="flex h-14 items-center gap-2 border-b px-3">
        <img
          src="/assets/victor-chidera-logo.webp"
          alt="Victor's Job OS logo"
          className="size-7 shrink-0 rounded-md object-contain"
        />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              Victor&apos;s Job OS
            </div>
            <div className="truncate text-[0.7rem] text-sidebar-foreground/60">
              Opportunity command center
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Primary navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2 pb-1.5 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.end
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(`${item.to}/`)
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Link
                              to={item.to}
                              aria-label={item.label}
                              className={cn(
                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                'size-8 text-sidebar-foreground/80',
                                isActive &&
                                  'bg-sidebar-accent text-sidebar-accent-foreground',
                              )}
                            />
                          }
                        >
                          <Icon />
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        to={item.to}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'w-full justify-start gap-2.5 text-sidebar-foreground/80',
                          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t p-3 text-[0.7rem] text-muted-foreground">
          V1 · Opportunity Intelligence
        </div>
      )}
    </aside>
  )
}

export function SidebarToggleButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <PanelLeftIcon />
    </Button>
  )
}

function PanelLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  )
}