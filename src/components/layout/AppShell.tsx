import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppFooter } from '@/components/layout/AppFooter'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const navigationType = useNavigationType()
  const scrollPositions = useRef(new Map<string, number>())
  const previousPathnameRef = useRef(location.pathname)
  const isOpportunitiesWorkspace = location.pathname.startsWith('/app/opportunities')
  const isDocsPage = location.pathname.startsWith('/app/docs')

  // Remember the scroll position for every history entry so going back to a
  // list (e.g. Opportunities) feels like returning, not reloading.
  useEffect(() => {
    const main = mainRef.current
    if (!main) {
      return
    }
    const key = location.key
    const onScroll = () => {
      scrollPositions.current.set(key, main.scrollTop)
    }
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [location.key])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) {
      return
    }

    const pathnameChanged = previousPathnameRef.current !== location.pathname
    previousPathnameRef.current = location.pathname

    if (navigationType === 'POP') {
      const saved = scrollPositions.current.get(location.key) ?? 0
      main.scrollTop = saved
      const frame = requestAnimationFrame(() => {
        main.scrollTop = saved
      })
      return () => cancelAnimationFrame(frame)
    }

    // New navigations start at the top. Filter changes on the same pathname
    // keep the current position.
    if (pathnameChanged) {
      main.scrollTop = 0
    }
  }, [location.key, location.pathname, navigationType])

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
          <main
            ref={mainRef}
            className={cn(
              'flex-1',
              isOpportunitiesWorkspace ? 'overflow-hidden' : 'overflow-y-auto',
            )}
          >
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </div>
      {!isOpportunitiesWorkspace && (
        <ScrollToTopButton container={mainRef} alwaysVisible={isDocsPage} />
      )}
      <MobileNavigation open={mobileOpen} onOpenChange={setMobileOpen} />
    </TooltipProvider>
  )
}