import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ArrowRight, CornerDownLeft, Sparkles, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DOC_SECTIONS, type DocsSection } from '@/features/docs/docs-content'
import { DOC_CATEGORIES } from '@/features/docs/DocsNavCategories'

interface DocsSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocsSearchModal({ open, onOpenChange }: DocsSearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Map each section to its category
  const sectionCategoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of DOC_CATEGORIES) {
      for (const secId of cat.sectionIds) {
        map.set(secId, cat.label)
      }
    }
    return map
  }, [])

  // Filter sections based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DOC_SECTIONS.slice(0, 6)

    return DOC_SECTIONS.filter((section) => {
      const matchTitle = section.title.toLowerCase().includes(q)
      const matchLabel = section.label.toLowerCase().includes(q)
      const matchDesc = section.description.toLowerCase().includes(q)
      const matchId = section.id.toLowerCase().includes(q)
      return matchTitle || matchLabel || matchDesc || matchId
    })
  }, [query])

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered.length])

  const handleSelect = (section: DocsSection) => {
    onOpenChange(false)
    const element = document.getElementById(section.id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      window.history.replaceState(null, '', `#${section.id}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 p-0 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-2xl shadow-2xl ring-1 ring-border/50"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Documentation</DialogTitle>
        </DialogHeader>

        {/* Input Bar */}
        <div className="relative flex items-center border-b border-border/60 px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation, workflows, architecture..."
            className="w-full bg-transparent text-sm sm:text-base font-normal text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto size-6 text-muted-foreground/50 mb-2" />
              <p>No documentation matches found for "{query}".</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try searching for terms like "Workflow", "Qualify", "Prompts", or "Privacy".
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {!query && (
                <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Suggested Sections
                </div>
              )}
              {filtered.map((section, index) => {
                const isSelected = index === selectedIndex
                const category = sectionCategoryMap.get(section.id) ?? 'Documentation'

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSelect(section)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-all ${
                      isSelected
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                        : 'text-foreground hover:bg-muted/60 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-xs font-mono font-medium">
                      {String(DOC_SECTIONS.findIndex((s) => s.id === section.id) + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {section.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal py-0 px-2 h-4 border-border/60">
                          {category}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <ArrowRight
                      className={`size-4 shrink-0 transition-transform ${
                        isSelected ? 'translate-x-0.5 text-primary opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 font-mono text-[9px]">↑</kbd>
              <kbd className="rounded border bg-background px-1 font-mono text-[9px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 font-mono text-[9px]">
                <CornerDownLeft className="inline size-2.5" />
              </kbd>
              Select
            </span>
          </div>
          <span>Victor Job OS Manual</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

