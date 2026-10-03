import { useState } from 'react'
import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppFooter } from '@/components/layout/AppFooter'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
        <div className="hidden lg:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            onMenuClick={() => setMobileOpen(true)}
            onToggleSidebar={() => setCollapsed((value) => !value)}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </div>
      <MobileNavigation open={mobileOpen} onOpenChange={setMobileOpen} />
    </TooltipProvider>
  )
}