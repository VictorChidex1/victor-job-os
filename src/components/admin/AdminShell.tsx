import { useState } from 'react'
import { Outlet } from 'react-router'
import { AdminMobileNavigation } from '@/components/admin/AdminMobileNavigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-svh w-full overflow-hidden bg-slate-50 text-slate-950">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AdminMobileNavigation open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>
  )
}
