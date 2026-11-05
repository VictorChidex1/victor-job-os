import { useEffect, useState } from 'react'
import type { DocsSection } from '@/features/docs/docs-content'

type TocSection = Pick<DocsSection, 'id' | 'label'>

export function useActiveSection(sections: TocSection[]): string {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    let frame = 0

    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        let current = sections[0]?.id ?? ''
        const threshold = 170

        for (const section of sections) {
          const element = document.getElementById(section.id)
          if (element && element.getBoundingClientRect().top <= threshold) {
            current = section.id
          }
        }

        setActiveId(current)
      })
    }

    update()
    document.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [sections])

  return activeId
}
