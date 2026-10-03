import { useLocation, useNavigate } from 'react-router'
import { LogOut, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { topBarTitles } from '@/components/layout/nav-config'
import { useAuth } from '@/hooks/useAuth'
import { signOutUser } from '@/services/auth'

interface TopBarProps {
  onMenuClick: () => void
  onToggleSidebar: () => void
}

function MenuIcon() {
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
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

export function TopBar({ onMenuClick, onToggleSidebar }: TopBarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const title =
    topBarTitles[pathname] ??
    (pathname.startsWith('/app/opportunities/')
      ? 'Opportunity'
      : pathname.startsWith('/app/outreach/')
        ? 'Outreach'
        : 'Victor\u2019s Job OS')

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Victor'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Open navigation menu"
      >
        <MenuIcon />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleSidebar}
        className="hidden lg:inline-flex"
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-7">
                <AvatarFallback>
                  {displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          }
        >
          <span className="sr-only">Open user menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="truncate">{displayName}</div>
            <div className="truncate text-xs font-normal text-muted-foreground">
              {user?.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="default" onSelect={() => navigate('/profile')}>
            <User />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem variant="default" onSelect={() => navigate('/settings')}>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              void signOutUser()
            }}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}