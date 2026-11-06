import { Link, useLocation } from 'react-router'
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { adminNavItems } from '@/components/admin/admin-nav'
import { signOutUser } from '@/services/auth'

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4">
        <img
          src="/assets/victor-job-os.png"
          alt="Victor Job OS logo"
          className="size-8 rounded-md object-contain"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-tight text-slate-950">
            Victor Job OS
          </div>
          <div className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-widest text-indigo-600">
            <ShieldCheck className="size-3" />
            Admin console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Admin navigation">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const active = item.end
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="px-3 pb-1 pt-6 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
          Coming next
        </div>
        {['Applications', 'Outreach', 'System health', 'Audit log'].map(
          (label) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400"
            >
              <span className="size-1.5 rounded-full bg-slate-300" />
              {label}
            </div>
          ),
        )}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-200 p-3">
        <Link
          to="/app/dashboard"
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-full justify-start gap-2.5 text-slate-600',
          )}
        >
          <ArrowLeft className="size-4" />
          Back to Job OS
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void signOutUser()}
          className="w-full justify-start gap-2.5 text-destructive hover:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
