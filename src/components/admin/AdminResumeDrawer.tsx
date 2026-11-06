import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Layers,
  ShieldCheck,
  Star,
  Tag,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/states/LoadingState'
import { useAdminResumeDetail } from '@/hooks/useAdminResumeDetail'

interface AdminResumeDrawerProps {
  resumeId: string | null
  open: boolean
  onClose: () => void
}

function formatDateTime(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'
}

export function AdminResumeDrawer({
  resumeId,
  open,
  onClose,
}: AdminResumeDrawerProps) {
  const { detail, loading, error, refresh } = useAdminResumeDetail(resumeId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const copyId = async () => {
    if (!resumeId) return
    await navigator.clipboard.writeText(resumeId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyUrl = async () => {
    if (!detail?.resumeUrl) return
    await navigator.clipboard.writeText(detail.resumeUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 border-l border-border bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{detail?.name || 'Resume Variant'}</SheetTitle>
          <SheetDescription>
            Admin resume variant inspector and asset review.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-8">
            <LoadingState rows={7} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              {error || 'Resume variant not found'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Unable to load resume record.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-6">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                    detail.isDefault
                      ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {detail.isDefault ? (
                    <Star className="size-5 fill-amber-500 text-amber-500" />
                  ) : (
                    <Layers className="size-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="size-3 text-muted-foreground/80" />
                    <span>{detail.isDefault ? 'Primary Baseline' : 'Tailored Customization'}</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.name}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to={`/admin/resumes/${detail.id}`} />}
                  className="rounded-xl font-semibold gap-1.5 text-xs"
                >
                  <span>Full Record</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-muted/30 p-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold text-xs ${
                  detail.isDefault
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-300'
                }`}
              >
                {detail.isDefault ? (
                  <>
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    Default Baseline
                  </>
                ) : (
                  <>
                    <Layers className="size-3 text-purple-600 dark:text-purple-400" />
                    Tailored Variant
                  </>
                )}
              </span>

              {detail.user && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <User className="size-3 text-muted-foreground" />
                  <span>{detail.user.displayName || detail.user.email}</span>
                </span>
              )}
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="doc" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/60 p-1 text-xs">
                <TabsTrigger value="doc" className="rounded-lg text-xs gap-1.5">
                  <FileText className="size-3.5" />
                  <span>Document & Notes</span>
                </TabsTrigger>
                <TabsTrigger value="stack" className="rounded-lg text-xs gap-1.5">
                  <Code2 className="size-3.5" />
                  <span>Target Roles & Stack</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="rounded-lg text-xs gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Document & Notes */}
              <TabsContent value="doc" className="space-y-4 pt-4 text-xs">
                {detail.resumeUrl ? (
                  <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-foreground">Attached Document Asset</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        PDF / Asset Live
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs leading-relaxed">
                      This resume variant has an attached cloud document ready for inspection or download.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        render={
                          <a
                            href={detail.resumeUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          />
                        }
                        className="rounded-xl gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Open Document</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void copyUrl()}
                        className="rounded-xl gap-1.5"
                      >
                        {copiedUrl ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        <span>{copiedUrl ? 'Copied Link' : 'Copy Link'}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <FileText className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No downloadable file URL attached to this variant.
                  </div>
                )}

                {detail.notes ? (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5">
                    <span className="font-bold text-foreground">Customization Notes & Positioning</span>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {detail.notes}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/80 bg-card p-4 text-muted-foreground">
                    No custom positioning notes recorded.
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Target Roles & Stack */}
              <TabsContent value="stack" className="space-y-4 pt-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    <span>Target Roles</span>
                  </h4>
                  {detail.targetRoles && detail.targetRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {detail.targetRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-muted-foreground">
                      No specific target roles specified.
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Code2 className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Emphasized Technologies & Skills</span>
                  </h4>
                  {detail.technologies && detail.technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {detail.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-mono font-medium text-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-muted-foreground">
                      No technology tags tagged on this variant.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: System Audit */}
              <TabsContent value="audit" className="space-y-3 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-card p-3">
                    <div className="text-muted-foreground text-[11px] font-semibold">
                      Created
                    </div>
                    <div className="font-mono text-xs mt-1">
                      {formatDateTime(detail.createdAt)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card p-3">
                    <div className="text-muted-foreground text-[11px] font-semibold">
                      Last Updated
                    </div>
                    <div className="font-mono text-xs mt-1">
                      {formatDateTime(detail.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="text-muted-foreground text-[11px] font-semibold">
                    System Identifiers
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Variant ID: {detail.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void copyId()}
                      className="h-6 px-2 text-[10px] gap-1"
                    >
                      {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  {detail.user && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      User ID: {detail.user.id}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 pt-4 text-xs">
              <span className="font-mono text-[11px] text-muted-foreground">
                Variant ID: {detail.id.slice(0, 14)}…
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                  Close
                </Button>
                <Button
                  size="sm"
                  render={<Link to={`/admin/resumes/${detail.id}`} />}
                  className="rounded-xl gap-1"
                >
                  <span>Full Record</span>
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
