import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { toast } from 'sonner'

export interface TabItem {
  id: string
  label: string
  language?: string
  code: string
  description?: string
}

interface CodePromptTabsProps {
  title?: string
  tabs: TabItem[]
}

export function CodePromptTabs({ title = 'System Payload & Prompt Inspector', tabs }: CodePromptTabsProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? '')
  const [hasCopied, setHasCopied] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  const handleCopy = () => {
    if (!activeTab) return
    navigator.clipboard.writeText(activeTab.code)
    setHasCopied(true)
    toast.success('Snippet copied to clipboard')
    setTimeout(() => setHasCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-2xs font-semibold border border-border/70'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Description if present */}
      {activeTab?.description && (
        <div className="border-b border-border/40 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          {activeTab.description}
        </div>
      )}

      {/* Code Display Area */}
      <div className="relative group bg-muted/25 p-4">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground opacity-80 transition-opacity hover:opacity-100 hover:text-foreground shadow-2xs backdrop-blur-sm"
        >
          {hasCopied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <pre className="font-mono text-xs leading-relaxed text-foreground/90 overflow-x-auto pr-16 py-1">
          <code>{activeTab?.code}</code>
        </pre>
      </div>
    </div>
  )
}

