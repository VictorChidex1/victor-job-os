import { useLocation } from 'react-router'
import { Menu, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminTopBarTitles } from '@/components/admin/admin-nav'
import { useAuth } from '@/hooks/useAuth'

export function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = pathname.startsWith('/admin/users/')
    ? 'User detail'
    : (adminTopBarTitles[pathname] ?? 'Admin')
  const environment =
    import.meta.env.VITE_FIREBASE_EMULATOR === 'true' ? 'Emulator' : 'Production'

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold text-slate-950">{title}</h1>
          <Badge
            variant="outline"
            className="hidden gap-1 border-indigo-200 bg-indigo-50 text-indigo-700 sm:inline-flex"
          >
            <ShieldCheck className="size-3" />
            Admin
          </Badge>
        </div>
        <p className="truncate text-xs text-slate-500">System administration console</p>
      </div>

      <Badge variant="outline" className="border-slate-200 text-slate-500">
        {environment}
      </Badge>
      <span className="hidden max-w-48 truncate text-xs text-slate-500 sm:block">
        {user?.email}
      </span>
    </header>
  )
}
