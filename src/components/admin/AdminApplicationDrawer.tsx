import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  ShieldCheck,
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
import { useAdminApplicationDetail } from '@/hooks/useAdminApplicationDetail'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { STAGE_THEMES } from '@/lib/applicationPipeline'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { ApplicationStatus } from '@/types/applications'

interface AdminApplicationDrawerProps {
  applicationId: string | null
  open: boolean
  onClose: () => void
}

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
}

function getMonogram(name?: string): string {
  return (name || 'JB')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function AdminApplicationDrawer({
  applicationId,
  open,
  onClose,
}: AdminApplicationDrawerProps) {
  const { detail, loading, error, refresh } = useAdminApplicationDetail(applicationId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedNotes, setCopiedNotes] = useState(false)

  const copyId = async () => {
    if (!applicationId) return
    await navigator.clipboard.writeText(applicationId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyNotes = async () => {
    if (!detail?.notes) return
    await navigator.clipboard.writeText(detail.notes)
    setCopiedNotes(true)
    setTimeout(() => setCopiedNotes(false), 2000)
  }

  const stageTheme = detail?.status
    ? STAGE_THEMES[detail.status] ?? STAGE_THEMES['not-started']
    : STAGE_THEMES['not-started']

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton
        className="overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl md:data-[side=right]:max-w-2xl bg-background border-l border-border/80 shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Application Inspection Drawer</SheetTitle>
          <SheetDescription>
            Inspect cross-user application status, preparation materials, and notes.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-6">
            <LoadingState label="Loading application details…" rows={6} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-bold text-foreground">
              Unable to load application
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {error ?? 'Application record not found.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-6">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-sm font-black text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  {getMonogram(detail.companyName)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="size-3 text-muted-foreground/80" />
                    <span className="truncate">{detail.companyName || 'Unknown company'}</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.jobTitle}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {detail.applicationUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    render={
                      <a href={detail.applicationUrl} target="_blank" rel="noreferrer" />
                    }
                  >
                    <ExternalLink className="size-3" />
                    <span className="hidden sm:inline">Apply link</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                  render={<Link to={`/admin/applications/${detail.id}`} />}
                  title="Open full page"
                >
                  <ArrowUpRight className="size-3.5" />
                  <span className="hidden sm:inline">Full page</span>
                </Button>
              </div>
            </div>

            {/* Quick Meta Pills Strip */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2.5 text-xs">
              {/* Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold text-[11px] ${stageTheme.badgeBg} ${stageTheme.badgeText}`}
              >
                <span className={`size-1.5 rounded-full ${stageTheme.dotColor}`} />
                <span>{APPLICATION_STATUS_LABELS[detail.status as ApplicationStatus] ?? detail.status}</span>
              </span>

              {/* Outcome if terminal */}
              {detail.outcome && (
                <span className="inline-flex items-center rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                  Outcome: {detail.outcome}
                </span>
              )}

              {/* Source Tag */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                {SOURCE_LABELS[detail.jobSource as keyof typeof SOURCE_LABELS] ?? detail.jobSource}
              </span>

              {/* User Attribution */}
              <Link
                to={detail.user ? `/admin/users/${detail.user.id}` : '#'}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/40 transition-colors"
                title={detail.user?.email || 'User owner'}
              >
                <User className="size-3 text-muted-foreground" />
                <span>{detail.user?.displayName || detail.user?.email || detail.userId.slice(0, 10)}</span>
              </Link>

              {/* Remote / Location */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                {detail.remote ? 'Remote' : detail.location || 'Location unlisted'}
              </span>

              {/* Updated Date */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <CalendarClock className="size-3" />
                Updated {formatDate(detail.updatedAt)}
              </span>
            </div>

            {/* Next Action Box */}
            {detail.nextAction && (
              <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs">
                <Clock className="size-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground">Next Scheduled Action:</div>
                  <div className="mt-0.5 text-foreground/90">{detail.nextAction}</div>
                  {detail.nextActionAt && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Due by: {formatDate(detail.nextActionAt)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Tabbed Content */}
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-2">
                <TabsTrigger value="notes" className="gap-1.5 text-xs">
                  <FileText className="size-3 text-indigo-500" />
                  <span>Notes & Dossier</span>
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-1.5 text-xs">
                  <FileText className="size-3 text-muted-foreground" />
                  <span>Materials</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  <ShieldCheck className="size-3 text-muted-foreground" />
                  <span>System Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Notes & Dossier */}
              <TabsContent value="notes" className="flex flex-col gap-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Candidate application notes & review commentary
                  </span>
                  {detail.notes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyNotes}
                      className="gap-1.5 h-7 text-xs"
                    >
                      {copiedNotes ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedNotes ? 'Copied' : 'Copy notes'}</span>
                    </Button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-4 text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  {detail.notes || 'No candidate notes have been recorded for this application.'}
                </div>
              </TabsContent>

              {/* Tab 2: Materials & Resume */}
              <TabsContent value="materials" className="flex flex-col gap-3 mt-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tailored Resume Snapshot
                  </div>
                  {detail.resumeUrl ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-emerald-600" />
                        <div>
                          <div className="font-semibold text-foreground">
                            {detail.resumeVariantName || 'Standard Resume Attached'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Attached to application submission
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        render={<a href={detail.resumeUrl} target="_blank" rel="noreferrer" />}
                      >
                        <ExternalLink className="size-3" />
                        Open PDF
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No standalone resume PDF URL associated with this application record.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: System Audit / Payload */}
              <TabsContent value="audit" className="flex flex-col gap-3 mt-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Application Document ID
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 font-mono text-xs">
                      <span className="truncate">{detail.id}</span>
                      <button
                        type="button"
                        onClick={copyId}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Copy Application ID"
                      >
                        {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Applicant User UID
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 font-mono text-xs">
                      <span className="truncate">{detail.userId}</span>
                      {detail.user && (
                        <Link
                          to={`/admin/users/${detail.user.id}`}
                          className="text-xs text-indigo-600 hover:underline font-sans font-medium"
                        >
                          View user record →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground">Application Origin:</span>{' '}
                      <span className="font-semibold">{detail.origin}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created Timestamp:</span>{' '}
                      <span className="font-semibold">{formatDate(detail.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

