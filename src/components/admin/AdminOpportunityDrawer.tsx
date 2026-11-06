import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Sparkles,
  User,
  AlertCircle,
  FileText,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { useAdminOpportunityDetail } from '@/hooks/useAdminOpportunityDetail'
import { SOURCE_LABELS } from '@/lib/job-sources'

interface AdminOpportunityDrawerProps {
  jobId: string | null
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

export function AdminOpportunityDrawer({
  jobId,
  open,
  onClose,
}: AdminOpportunityDrawerProps) {
  const { detail, loading, error, refresh } = useAdminOpportunityDetail(jobId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedDesc, setCopiedDesc] = useState(false)

  const copyId = async () => {
    if (!jobId) return
    await navigator.clipboard.writeText(jobId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyDesc = async () => {
    if (!detail?.description) return
    await navigator.clipboard.writeText(detail.description)
    setCopiedDesc(true)
    setTimeout(() => setCopiedDesc(false), 2000)
  }

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
          <SheetTitle>Opportunity Inspection Drawer</SheetTitle>
          <SheetDescription>
            Inspect cross-user opportunity details, AI fit analysis, and raw metadata.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-6">
            <LoadingState label="Loading opportunity details…" rows={6} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-bold text-foreground">
              Unable to load opportunity
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {error ?? 'Opportunity record not found.'}
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
            {/* Top Header Card */}
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
                    {detail.title}
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
                  render={<Link to={`/admin/opportunities/${detail.id}`} />}
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
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold text-[11px] ${
                  detail.status === 'qualified'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : detail.status === 'new'
                      ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                      : detail.status === 'rejected'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'border-border/80 bg-background text-muted-foreground'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    detail.status === 'qualified'
                      ? 'bg-emerald-500'
                      : detail.status === 'new'
                        ? 'bg-sky-500'
                        : detail.status === 'rejected'
                          ? 'bg-rose-500'
                          : 'bg-muted-foreground'
                  }`}
                />
                <span className="capitalize">{detail.status}</span>
              </span>

              {/* Source Tag */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                <Globe className="size-3" />
                {SOURCE_LABELS[detail.source as keyof typeof SOURCE_LABELS] ?? detail.source}
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

              {/* Discovered Date */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <CalendarClock className="size-3" />
                {formatDate(detail.discoveredAt)}
              </span>
            </div>

            {/* Skills Badges */}
            {detail.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Skills:
                </span>
                {detail.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[11px] font-normal py-0">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            {/* Main Tabbed Content */}
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-2">
                <TabsTrigger value="analysis" className="gap-1.5 text-xs">
                  <Sparkles className="size-3 text-indigo-500" />
                  <span>AI Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="description" className="gap-1.5 text-xs">
                  <FileText className="size-3 text-muted-foreground" />
                  <span>Job Description</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  <ShieldCheck className="size-3 text-muted-foreground" />
                  <span>System Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: AI Analysis */}
              <TabsContent value="analysis" className="flex flex-col gap-4 mt-3">
                {detail.analysis ? (
                  <>
                    {/* Score Hero Card */}
                    <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-2xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          Match Assessment
                        </div>
                        <div className="mt-0.5 text-xl font-extrabold text-foreground">
                          {detail.analysis.fitScore !== undefined
                            ? `${detail.analysis.fitScore}% Profile Fit`
                            : 'Evaluated'}
                        </div>
                      </div>
                      {detail.analysis.fitScore !== undefined && (
                        <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 font-mono text-base font-black text-white shadow-xs">
                          {detail.analysis.fitScore}%
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    {detail.analysis.summary && (
                      <div className="rounded-xl border border-border/70 bg-card p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Executive Evaluation
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                          {detail.analysis.summary}
                        </p>
                      </div>
                    )}

                    {/* Matched Skills */}
                    {detail.analysis.matchedSkills.length > 0 && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
                          <CheckCircle2 className="size-3.5" />
                          <span>Matched Competencies ({detail.analysis.matchedSkills.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.analysis.matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-background px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                            >
                              <Check className="size-2.5" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills / Concerns */}
                    {[...detail.analysis.missingSkills, ...detail.analysis.concerns].length > 0 && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                          <AlertCircle className="size-3.5" />
                          <span>Identified Gaps & Concerns</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[...detail.analysis.missingSkills, ...detail.analysis.concerns].map(
                            (item) => (
                              <span
                                key={item}
                                className="inline-flex items-center rounded-md border border-amber-500/30 bg-background px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
                              >
                                {item}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Company Intelligence */}
                    {detail.company && (
                      <div className="rounded-xl border border-border/70 bg-card p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Company Dossier · {detail.company.name}
                        </div>
                        {detail.company.industry && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                            {detail.company.industry}
                          </div>
                        )}
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {detail.company.researchSummary ||
                            detail.company.description ||
                            'No research summary compiled.'}
                        </p>
                        {detail.company.website && (
                          <a
                            href={detail.company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                          >
                            Visit company website
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <Sparkles className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No automated fit analysis has been generated for this opportunity.
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Full Description */}
              <TabsContent value="description" className="flex flex-col gap-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Original job description as retrieved from {detail.source}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyDesc}
                    className="gap-1.5 h-7 text-xs"
                  >
                    {copiedDesc ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiedDesc ? 'Copied' : 'Copy JD'}</span>
                  </Button>
                </div>
                <div className="max-h-[480px] overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-4 font-sans text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  {detail.description || 'No description provided in raw source payload.'}
                </div>
              </TabsContent>

              {/* Tab 3: System Audit / Payload */}
              <TabsContent value="audit" className="flex flex-col gap-3 mt-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Opportunity Document ID
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 font-mono text-xs">
                      <span className="truncate">{detail.id}</span>
                      <button
                        type="button"
                        onClick={copyId}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Copy Opportunity ID"
                      >
                        {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Owner User UID
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
                      <span className="text-muted-foreground">Source Provider:</span>{' '}
                      <span className="font-semibold">{detail.source}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remote Flag:</span>{' '}
                      <span className="font-semibold">{detail.remote ? 'Yes' : 'No'}</span>
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

