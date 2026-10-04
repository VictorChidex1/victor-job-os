import { Link, useLocation } from 'react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navGroups } from '@/components/layout/nav-config'

interface AppSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AppSidebar({ collapsed = false, onToggle }: AppSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "flex h-full shrink-0 flex-col border-r bg-sidebar transition-[width] duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <img
          src="/assets/victor-job-os.png"
          alt="Victor's Job OS logo"
          className="size-7 shrink-0 rounded-md object-contain"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
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
                          'w-full min-w-0 justify-start gap-2.5 overflow-hidden text-sidebar-foreground/80',
                          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-left">
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t p-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  aria-label="Expand sidebar"
                  className="mx-auto flex size-8 text-sidebar-foreground/80"
                />
              }
            >
              <PanelLeftOpen className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate px-2 text-[0.7rem] text-muted-foreground">
              V1 · Opportunity Intelligence
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="shrink-0 text-sidebar-foreground/80"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </div>
        )}
      </div>
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
      {collapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
    </Button>
  )
}