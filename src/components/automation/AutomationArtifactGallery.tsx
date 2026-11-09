import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { getDownloadURL, ref } from 'firebase/storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAutomationArtifacts } from '@/services/automation'
import { storage } from '@/services/storage'
import type {
  AutomationArtifact,
  AutomationRunArtifacts,
} from '@/types/automation'
import { cn } from '@/lib/utils'

function formatCaptureTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sizeLabel(size: number): string {
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function ArtifactCard({
  artifact,
  url,
}: {
  artifact: AutomationArtifact
  url?: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={artifact.label}
            loading="lazy"
            className="h-36 w-full bg-muted/40 object-contain object-top"
          />
        </a>
      ) : (
        <div className="flex h-36 items-center justify-center bg-muted/40 px-4 text-center text-xs text-muted-foreground">
          Image unavailable or expired.
        </div>
      )}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {artifact.kind === 'error' ? 'Error' : 'Screenshot'}
          </Badge>
          <span className="text-xs font-medium text-foreground">{artifact.label}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {sizeLabel(artifact.size)} · {formatCaptureTime(artifact.createdAt)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-fit gap-1.5 px-2 text-xs"
              render={<a href={url} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink className="size-3.5" />
              Open full size
            </Button>
          )}
          {artifact.pageTitle && (
            <span className="truncate text-xs text-muted-foreground">
              {artifact.pageTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AutomationArtifactGallery({
  runId,
  defaultOpen = false,
  className,
}: {
  runId: string
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [record, setRecord] = useState<AutomationRunArtifacts | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAutomationArtifacts(runId)
      setRecord(data)
      setExpired(
        Boolean(data?.expiresAt && data.expiresAt.toMillis() < Date.now()),
      )
      if (data?.artifacts.length) {
        const resolved = await Promise.all(
          data.artifacts.map(async (artifact) => {
            const url = await getDownloadURL(ref(storage, artifact.storagePath)).catch(
              () => null,
            )
            return [artifact.id, url] as const
          }),
        )
        setUrls(
          Object.fromEntries(
            resolved.filter((entry): entry is readonly [string, string] =>
              Boolean(entry[1]),
            ),
          ),
        )
      } else {
        setUrls({})
      }
      setError(null)
    } catch {
      setError('Unable to load screenshots.')
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [runId])

  useEffect(() => {
    if (!open || loaded) return
    // oxlint-disable-next-line react/set-state-in-effect -- lazy fetch when the artifact panel opens; state updates occur after await
    void load()
  }, [open, loaded, load])

  const artifacts = record?.artifacts ?? []

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-background',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ImageIcon className="size-4 text-primary" />
          Screenshots &amp; error captures
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {loaded && `${artifacts.length} capture${artifacts.length === 1 ? '' : 's'}`}
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Failure evidence is retained for 24 hours. Images are WebP and capped at
              300 KB.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {error ? (
            <p className="border-t border-rose-500/20 bg-rose-500/5 px-3 py-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </p>
          ) : loading && !loaded ? (
            <p className="flex items-center gap-2 border-t border-border/40 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading screenshots…
            </p>
          ) : (
            <>
              {expired && (
                <p className="border-t border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  This capture set has expired and may be removed at any time.
                </p>
              )}
              {artifacts.length === 0 ? (
                <p className="border-t border-border/40 px-3 py-4 text-xs text-muted-foreground">
                  No screenshots were captured for this run.
                </p>
              ) : (
                <div className="grid gap-3 border-t border-border/40 p-3 sm:grid-cols-2">
                  {artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      url={urls[artifact.id]}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
