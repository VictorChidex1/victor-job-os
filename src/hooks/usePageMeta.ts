import { useEffect } from 'react'

const SITE_URL = 'https://victor-job-os.vercel.app'

interface PageMetaOptions {
  title: string
  description?: string
  noindex?: boolean
  path?: string
}

function setMeta(selector: string, attribute: string, value: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    const [name, attrValue] = selector.match(/name="([^"]+)"|property="([^"]+)"/)?.slice(1) ?? []
    element.setAttribute(attribute, attrValue || name || '')
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export function usePageMeta({ title, description, noindex = false, path = '/' }: PageMetaOptions) {
  useEffect(() => {
    document.title = title

    if (description) {
      setMeta('meta[name="description"]', 'content', description)
      setMeta('meta[property="og:description"]', 'content', description)
      setMeta('meta[name="twitter:description"]', 'content', description)
    }

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      canonical.href = `${SITE_URL}${path}`
    }

    const emulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
    const shouldNoindex = noindex || emulator
    setMeta('meta[name="robots"]', 'content', shouldNoindex ? 'noindex,nofollow' : 'index,follow')
  }, [title, description, noindex, path])
}