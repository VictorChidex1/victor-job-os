import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  Users,
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
import { useAdminCompanyDetail } from '@/hooks/useAdminCompanyDetail'

interface AdminCompanyDrawerProps {
  companyId: string | null
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

function getMonogram(name?: string): string {
  return (name || 'CO')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function AdminCompanyDrawer({
  companyId,
  open,
  onClose,
}: AdminCompanyDrawerProps) {
  const { detail, loading, error, refresh } = useAdminCompanyDetail(companyId ?? undefined)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)

  const copyId = async () => {
    if (!companyId) return
    await navigator.clipboard.writeText(companyId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copySummary = async () => {
    if (!detail?.researchSummary) return
    await navigator.clipboard.writeText(detail.researchSummary)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-0 border-l border-border bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{detail?.name || 'Company Profile'}</SheetTitle>
          <SheetDescription>
            Admin deep dossier and linked talent pipeline.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-8">
            <LoadingState rows={8} />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              {error || 'Company not found'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Unable to load company record.
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
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 font-mono text-base font-black text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  {getMonogram(detail.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="size-3 text-muted-foreground/80" />
                    <span className="truncate">{detail.industry || 'Enterprise'}</span>
                  </div>
                  <h2 className="mt-0.5 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
                    {detail.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {detail.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {detail.location}
                      </span>
                    )}
                    {detail.website && (
                      <a
                        href={detail.website.startsWith('http') ? detail.website : `https://${detail.website}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="size-3" />
                        {detail.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to={`/admin/companies/${detail.id}`} />}
                  className="rounded-xl font-semibold gap-1.5 text-xs"
                >
                  <span>Full Dossier</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-muted/30 p-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold text-xs ${
                  detail.researched
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                }`}
              >
                {detail.researched ? (
                  <>
                    <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Researched Intelligence
                  </>
                ) : (
                  <>
                    <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                    Awaiting Research
                  </>
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-800 dark:text-blue-300 text-xs">
                <Briefcase className="size-3 text-blue-600 dark:text-blue-400" />
                {detail.jobCount} linked {detail.jobCount === 1 ? 'role' : 'roles'}
              </span>

              {detail.user && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <User className="size-3 text-muted-foreground" />
                  <span>{detail.user.displayName || detail.user.email}</span>
                </span>
              )}
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="intel" className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/60 p-1 text-xs">
                <TabsTrigger value="intel" className="rounded-lg text-xs gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span>Intelligence</span>
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="rounded-lg text-xs gap-1.5">
                  <Briefcase className="size-3.5" />
                  <span>Pipeline ({detail.opportunities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="contacts" className="rounded-lg text-xs gap-1.5">
                  <Users className="size-3.5" />
                  <span>Contacts ({detail.contacts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="rounded-lg text-xs gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Intelligence */}
              <TabsContent value="intel" className="space-y-4 pt-4 text-xs">
                {detail.researchSummary ? (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 text-[11px]">
                        <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                        Executive Research Summary
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void copySummary()}
                        className="size-7 rounded-lg"
                        title="Copy Summary"
                      >
                        {copiedSummary ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-foreground leading-relaxed whitespace-pre-line text-xs font-normal">
                      {detail.researchSummary}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <Sparkles className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No deep AI research summary logged yet for this company.
                  </div>
                )}

                {detail.description && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5">
                    <span className="font-bold text-foreground">Overview & Mission</span>
                    <p className="text-muted-foreground leading-relaxed">
                      {detail.description}
                    </p>
                  </div>
                )}

                {detail.product && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5">
                    <span className="font-bold text-foreground">Core Product & Offerings</span>
                    <p className="text-muted-foreground leading-relaxed">
                      {detail.product}
                    </p>
                  </div>
                )}

                {detail.hiringSignals && detail.hiringSignals.length > 0 && (
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                    <span className="font-bold text-foreground">Hiring Signals & Market Clues</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.hiringSignals.map((sig, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Talent Pipeline */}
              <TabsContent value="pipeline" className="space-y-4 pt-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center justify-between">
                    <span>Active Opportunities</span>
                    <span className="text-muted-foreground font-normal">
                      {detail.opportunities.length} total
                    </span>
                  </h4>
                  {detail.opportunities.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {detail.opportunities.map((opp) => (
                        <div
                          key={opp.id}
                          className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3"
                        >
                          <div>
                            <span className="font-bold text-foreground">{opp.title}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>Source: {opp.source}</span>
                              <span>·</span>
                              <span>Found: {formatDate(opp.discoveredAt)}</span>
                            </div>
                          </div>
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-muted-foreground">
                            {opp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-muted-foreground">
                      No linked opportunities found.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-border/80 bg-card p-3">
                    <div className="text-muted-foreground text-[11px] uppercase font-semibold">
                      Applications Active
                    </div>
                    <div className="font-mono text-xl font-bold mt-1">
                      {detail.applications.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card p-3">
                    <div className="text-muted-foreground text-[11px] uppercase font-semibold">
                      Outreach Touches
                    </div>
                    <div className="font-mono text-xl font-bold mt-1">
                      {detail.outreach.length}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Contacts */}
              <TabsContent value="contacts" className="space-y-3 pt-4 text-xs">
                {detail.contacts.length > 0 ? (
                  detail.contacts.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {contact.name || 'Executive Contact'}
                        </span>
                        {contact.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <Check className="size-2.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            Unverified
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {contact.role || 'Key Decision Maker'}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-primary text-[11px] pt-1">
                          <Mail className="size-3" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    <Users className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                    No executive contacts recorded for this company.
                  </div>
                )}
              </TabsContent>

              {/* Tab 4: Audit */}
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
                    <span>Company ID: {detail.id}</span>
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
                Company ID: {detail.id.slice(0, 14)}…
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                  Close
                </Button>
                <Button
                  size="sm"
                  render={<Link to={`/admin/companies/${detail.id}`} />}
                  className="rounded-xl gap-1"
                >
                  <span>Full Profile</span>
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
