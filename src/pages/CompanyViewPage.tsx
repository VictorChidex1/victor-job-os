import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useContacts } from '@/hooks/useContacts'
import { usePageMeta } from '@/hooks/usePageMeta'
import { aiErrorMessage } from '@/lib/ai-errors'
import { getCompany } from '@/services/companies'
import { createContact } from '@/services/contacts'
import { functions } from '@/services/functions'
import { listJobsForCompany } from '@/services/jobs'
import { listOutreachForCompany } from '@/services/outreach'
import type { Company } from '@/types/companies'
import type { Job } from '@/types/jobs'
import type { Outreach } from '@/types/outreach'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  'needs-review': 'Needs review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  sent: 'Sent',
  replied: 'Replied',
  'follow-up-due': 'Follow-up due',
  closed: 'Closed',
}

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'
}

export function CompanyViewPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [outreach, setOutreach] = useState<Outreach[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [researching, setResearching] = useState(false)

  const [showContactForm, setShowContactForm] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [contactSource, setContactSource] = useState('')
  const [contactVerified, setContactVerified] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

  const { items: contacts, refresh: refreshContacts } = useContacts(id)

  usePageMeta({
    title: company?.name ? `${company.name} — Victor Job OS` : 'Company — Victor Job OS',
    description: 'Company research, opportunities, contacts, and outreach history.',
    noindex: true,
    path: `/app/companies/${id ?? ''}`,
  })

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let active = true
    Promise.all([
      getCompany(id),
      user ? listJobsForCompany(user.uid, id, 20) : Promise.resolve([]),
      user ? listOutreachForCompany(user.uid, id) : Promise.resolve([]),
    ])
      .then(([companyData, companyJobs, companyOutreach]) => {
        if (!active) return
        setCompany(companyData)
        setJobs(companyJobs)
        setOutreach(companyOutreach)
      })
      .catch(() => {
        if (active) setError('We couldn’t load this company.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, user])

  if (!id) {
    return (
      <PageContainer title="Company">
        <EmptyState title="No company selected" />
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer title="Company">
        <LoadingState label="Loading company…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !company) {
    return (
      <PageContainer title="Company">
        <EmptyState title={error ?? 'Company not found'} description="It may have been removed." />
      </PageContainer>
    )
  }

  const newestJob = jobs[0]

  async function runResearch() {
    if (!company) return
    if (!newestJob) {
      toast('No linked jobs', {
        description: 'Run discovery first so this company has a job to research from.',
      })
      return
    }
    setResearching(true)
    try {
      const callable = httpsCallable(functions, 'researchOpportunity')
      await callable({ jobId: newestJob.id })
      const [refreshedCompany, refreshedJobs] = await Promise.all([
        getCompany(company.id),
        user ? listJobsForCompany(user.uid, company.id, 20) : Promise.resolve([]),
      ])
      setCompany(refreshedCompany)
      setJobs(refreshedJobs)
      toast('Company research complete')
    } catch (researchError) {
      toast('Unable to research', {
        description: aiErrorMessage(researchError, 'Please try again.'),
      })
    } finally {
      setResearching(false)
    }
  }

  async function addContact(event: FormEvent) {
    event.preventDefault()
    if (!user || !company) return
    setSavingContact(true)
    try {
      await createContact(user.uid, {
        companyId: company.id,
        companyName: company.name,
        ...(contactName.trim() ? { name: contactName.trim() } : {}),
        ...(contactEmail.trim() ? { email: contactEmail.trim() } : {}),
        ...(contactRole.trim() ? { role: contactRole.trim() } : {}),
        ...(contactSource.trim() ? { sourceUrl: contactSource.trim() } : {}),
        confidence: contactVerified ? 'high' : 'medium',
        verified: contactVerified,
      })
      await refreshContacts()
      setContactName('')
      setContactEmail('')
      setContactRole('')
      setContactSource('')
      setContactVerified(false)
      setShowContactForm(false)
      toast('Contact added')
    } catch {
      toast('Unable to add contact')
    } finally {
      setSavingContact(false)
    }
  }

  return (
    <PageContainer
      title={company.name}
      description={[company.industry, company.location].filter(Boolean).join(' · ') || 'Company workspace'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void runResearch()} disabled={researching}>
            <Sparkles />
            {researching ? 'Researching…' : company.researched ? 'Re-research' : 'Research company'}
          </Button>
          <Link
            to={`/app/opportunities?companyId=${encodeURIComponent(company.id)}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View opportunities
          </Link>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/app/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Companies
        </Link>
        <Badge variant={company.researched ? 'secondary' : 'outline'}>
          {company.researched ? 'Researched' : 'Not researched'}
        </Badge>
        <Badge variant="outline">{company.jobCount ?? jobs.length} opportunities</Badge>
      </div>

      {/* Header / about */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4"
              >
                <Globe className="size-3.5" />
                {company.website}
              </a>
            )}
            {company.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {company.location}
              </span>
            )}
            {company.industry && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {company.industry}
              </span>
            )}
          </div>
          {company.description && <p>{company.description}</p>}
          {company.product && (
            <div>
              <span className="font-medium text-foreground">Product/service:</span> {company.product}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Company research</CardTitle>
        </CardHeader>
        <CardContent>
          {company.researched ? (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {company.roleContext && (
                <div className="rounded-md bg-muted/40 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Role context</div>
                  <p className="mt-1">{company.roleContext}</p>
                </div>
              )}
              {company.hiringSignals.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Hiring signals</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {company.hiringSignals.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-[0.65rem]">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.researchSummary && (
                <div className="rounded-md bg-muted/40 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">AI summary</div>
                  <p className="mt-1">{company.researchSummary}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {company.sourceUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    Source
                  </a>
                ))}
                <span>Researched {formatDate(company.lastResearchedAt)}</span>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Not researched yet"
              description="Run research to collect company context, product, and hiring signals."
            />
          )}
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Open opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState
              title="No linked opportunities"
              description="Jobs appear here once discovery has stored roles for this company."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/app/opportunities/${job.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-foreground"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{job.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {job.remote ? 'Remote' : job.location || 'Location unknown'} · {job.status}
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Contacts</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowContactForm((value) => !value)}
            >
              {showContactForm ? <X /> : <UserPlus />}
              {showContactForm ? 'Cancel' : 'Add contact'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showContactForm && (
            <form onSubmit={addContact} className="flex flex-col gap-3 rounded-xl border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Hiring manager"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-role">Role</Label>
                  <Input
                    id="contact-role"
                    value={contactRole}
                    onChange={(event) => setContactRole(event.target.value)}
                    placeholder="Engineering Manager"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-source">Source URL</Label>
                  <Input
                    id="contact-source"
                    value={contactSource}
                    onChange={(event) => setContactSource(event.target.value)}
                    placeholder="LinkedIn or company page"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={contactVerified}
                  onChange={(event) => setContactVerified(event.target.checked)}
                  className="size-4 rounded border-border"
                />
                Email verified
              </label>
              <div>
                <Button type="submit" size="sm" disabled={savingContact}>
                  <Plus />
                  {savingContact ? 'Saving…' : 'Save contact'}
                </Button>
              </div>
            </form>
          )}

          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {contact.name || contact.email || 'Contact'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {contact.role && <span>{contact.role}</span>}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Mail className="size-3" />
                          {contact.email}
                        </a>
                      )}
                      {contact.verified && <Badge variant="secondary" className="text-[0.6rem]">Verified</Badge>}
                    </div>
                  </div>
                  {contact.sourceUrl && (
                    <a
                      href={contact.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline underline-offset-4"
                    >
                      Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outreach history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Outreach history</CardTitle>
        </CardHeader>
        <CardContent>
          {outreach.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outreach for this company yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {outreach.map((item) => (
                <Link
                  key={item.id}
                  to={`/app/outreach/${item.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-foreground"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{item.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.contactName || item.contactEmail || 'No recipient'} · {formatDate(item.updatedAt)}
                    </div>
                  </div>
                  <Badge variant={item.status === 'replied' ? 'secondary' : 'outline'} className="shrink-0">
                    {statusLabels[item.status] ?? item.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <div className="text-xs text-muted-foreground">
        Last activity {formatDate(company.updatedAt ?? company.lastSeenAt)}
      </div>
    </PageContainer>
  )
}
