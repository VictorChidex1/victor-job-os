import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'How It Works', href: '#workflow' },
  { label: 'Problem', href: '#problem' },
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Built Around You', href: '#profile' },
  { label: 'Automation', href: '#automation' },
  { label: 'Technology', href: '#technology' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const updateScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  return (
    <>
      <motion.header
        className={`fixed left-0 right-0 z-50 mx-auto flex justify-center w-full px-4 sm:px-6 transition-all duration-500 ease-out ${
          isScrolled ? 'top-3' : 'top-6'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div
          className={`relative flex w-full max-w-7xl items-center justify-between rounded-full border backdrop-blur-xl transition-all duration-500 ease-out ${
            isScrolled
              ? 'bg-background/80 border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-2.5 px-4 md:px-6'
              : 'bg-background/40 border-border/20 shadow-sm py-3.5 px-4 md:px-8'
          }`}
        >
          {/* Left: Logo */}
          <div className="flex flex-1 items-center justify-start shrink-0">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
              className="flex items-center gap-2 relative z-10"
            >
              <img
                src="/assets/victor-job-os.png"
                alt="Victor Job OS logo"
                className="size-7 rounded object-contain"
              />
              <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">Victor Job OS</span>
            </Link>
          </div>

          {/* Center: Nav (Desktop) */}
          <div className="hidden md:flex flex-auto items-center justify-center">
            <nav className="flex items-center gap-0.5 lg:gap-1 relative z-10" aria-label="Landing navigation" onMouseLeave={() => setHoveredIndex(null)}>
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  className="relative rounded-full px-3 lg:px-4 xl:px-5 py-2 text-[12px] lg:text-[13px] xl:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                >
                  {hoveredIndex === index && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-muted/80"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="hidden md:block relative z-10">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="sm" className="rounded-full px-6 font-medium shadow-sm hover:shadow-md transition-shadow" render={<Link to="/login" />}>
                  Open Job OS
                </Button>
              </motion.div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden relative z-10 rounded-full"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-[4.5rem] z-40 mx-4 rounded-2xl border border-border/50 bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-2" aria-label="Mobile landing navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button size="sm" className="w-full rounded-full" render={<Link to="/login" />}>
                  Open Job OS
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}