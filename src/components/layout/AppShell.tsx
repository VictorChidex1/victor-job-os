import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppFooter } from '@/components/layout/AppFooter'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

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
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </div>
      <ScrollToTopButton container={mainRef} />
      <MobileNavigation open={mobileOpen} onOpenChange={setMobileOpen} />
    </TooltipProvider>
  )
}