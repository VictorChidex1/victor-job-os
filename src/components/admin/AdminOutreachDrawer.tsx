import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  Copy,
  Mail,
  MessageSquare,
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
import { useAdminOutreachDetail } from '@/hooks/useAdminOutreachDetail'

interface AdminOutreachDrawerProps {
  outreachId: string | null
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

export function AdminOutreachDrawer({
  outreachId,
  open,
  onClose,
}: AdminOutreachDrawerProps) {
  const { detail, loading, error, refresh } = useAdminOutreachDetail(outreachId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)

  const copyId = async () => {
    if (!outreachId) return
    await navigator.clipboard.writeText(outreachId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyPitch = async () => {
    if (!detail?.body) return
    const text = `Subject: ${detail.subject || 'Outreach'}\n\n${detail.body}`
    await navigator.clipboard.writeText(text)
    setCopiedPitch(true)
    setTimeout(() => setCopiedPitch(false), 2000)
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
          <SheetTitle>Outreach Inspection Drawer</SheetTitle>
          <SheetDescription>
            Inspect cross-user message drafts, recipient contacts, and follow-up threads.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-6">
            <LoadingState label="Loading outreach details…" rows={6} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-bold text-foreground">
              Unable to load outreach
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {error ?? 'Outreach communication record not found.'}
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
                    <span className="truncate">{detail.companyName || 'Target Company'}</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.jobTitle || detail.subject || 'Outreach Pitch'}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {detail.contactEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    render={<a href={`mailto:${detail.contactEmail}`} />}
                  >
                    <Mail className="size-3" />
                    <span className="hidden sm:inline">Send email</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                  render={<Link to={`/admin/outreach/${detail.id}`} />}
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
                  detail.status === 'sent'
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    : detail.status === 'replied'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : detail.status === 'needs-review'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : detail.status === 'follow-up-due'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'border-border/80 bg-background text-muted-foreground'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    detail.status === 'sent'
                      ? 'bg-blue-500'
                      : detail.status === 'replied'
                        ? 'bg-emerald-500'
                        : detail.status === 'needs-review'
                          ? 'bg-amber-500'
                          : detail.status === 'follow-up-due'
                            ? 'bg-rose-500'
                            : 'bg-muted-foreground'
                  }`}
                />
                <span className="capitalize">{detail.status}</span>
              </span>

              {/* Recipient Contact */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <Mail className="size-3" />
                <span>{detail.contactName || detail.contactEmail || 'Direct company outreach'}</span>
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

              {/* Follow-up count */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground font-mono">
                {detail.followUpCount > 0 ? `${detail.followUpCount} follow-up${detail.followUpCount === 1 ? '' : 's'}` : 'Initial pitch'}
              </span>

              {/* Updated Date */}
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <CalendarClock className="size-3" />
                {formatDate(detail.updatedAt)}
              </span>
            </div>

            {/* Main Tabbed Content */}
            <Tabs defaultValue="pitch" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-2">
                <TabsTrigger value="pitch" className="gap-1.5 text-xs">
                  <MessageSquare className="size-3 text-indigo-500" />
                  <span>Pitch Body</span>
                </TabsTrigger>
                <TabsTrigger value="threads" className="gap-1.5 text-xs">
                  <CalendarClock className="size-3 text-muted-foreground" />
                  <span>Cadence ({detail.followUps.length})</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  <ShieldCheck className="size-3 text-muted-foreground" />
                  <span>System Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Pitch Body */}
              <TabsContent value="pitch" className="flex flex-col gap-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground truncate max-w-sm">
                    Subject: {detail.subject || 'No subject line'}
                  </div>
                  {detail.body && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPitch}
                      className="gap-1.5 h-7 text-xs"
                    >
                      {copiedPitch ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedPitch ? 'Copied' : 'Copy pitch'}</span>
                    </Button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-4 font-sans text-xs leading-relaxed text-foreground/90 whitespace-pre-line shadow-inner">
                  {detail.body || 'No message draft stored in outreach payload.'}
                </div>
              </TabsContent>

              {/* Tab 2: Follow-up Cadence */}
              <TabsContent value="threads" className="flex flex-col gap-3 mt-3">
                {detail.followUps.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {detail.followUps.map((fu, idx) => (
                      <div
                        key={fu.id || idx}
                        className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            Touchpoint #{idx + 1}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatDate(fu.scheduledFor || fu.sentAt)}
                          </span>
                        </div>
                        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {fu.draftBody || fu.draftSubject || 'Scheduled follow-up touchpoint.'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <CalendarClock className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No scheduled or dispatched follow-ups recorded yet.
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: System Audit / Payload */}
              <TabsContent value="audit" className="flex flex-col gap-3 mt-3">
                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Outreach Document ID
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 font-mono text-xs">
                      <span className="truncate">{detail.id}</span>
                      <button
                        type="button"
                        onClick={copyId}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Copy Outreach ID"
                      >
                        {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Sender User UID
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
                      <span className="text-muted-foreground">Target Company ID:</span>{' '}
                      <span className="font-semibold">{detail.companyId || 'Direct'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Initial Outreach:</span>{' '}
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

