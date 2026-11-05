import { useEffect, useState, type RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScrollToTopButtonProps {
  container?: RefObject<HTMLElement | null>
  /** Keep the control visible even before the page is scrolled. */
  alwaysVisible?: boolean
}

const SHOW_THRESHOLD = 400

export function ScrollToTopButton({
  container,
  alwaysVisible = false,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (alwaysVisible) {
      return
    }

    const target = container?.current ?? window

    function onScroll() {
      const scrollTop = target === window ? window.scrollY : (target as HTMLElement).scrollTop
      setVisible(scrollTop > SHOW_THRESHOLD)
    }

    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [container, alwaysVisible])

  const show = alwaysVisible || visible

  function scrollToTop() {
    if (container?.current) {
      container.current.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed right-5 bottom-5 z-40"
        >
          <Button
            type="button"
            size="icon-lg"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            title="Back to top"
            className="shadow-lg"
          >
            <ArrowUp className="size-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}