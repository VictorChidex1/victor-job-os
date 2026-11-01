import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Mail,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { functions } from '@/services/functions'
import { getJob } from '@/services/jobs'
import { useJobAnalysis } from '@/hooks/useJobAnalysis'
import { useCompany } from '@/hooks/useCompany'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { useJobApplication } from '@/hooks/useJobApplication'
import { APPLICATION_STATUS_LABELS } from '@/lib/applications'
import { SOURCE_LABELS, SOURCE_ATTRIBUTION_URL } from '@/lib/job-sources'
import { aiErrorMessage } from '@/lib/ai-errors'
import { createApplicationFromJob } from '@/services/applications'
import type { Job, JobStatus } from '@/types/jobs'

interface OpportunityDetailProps {
  jobId: string
  isFullPage: boolean
  onClose: () => void
  onToggleFullPage: () => void
  onJobUpdated?: (update: { id: string; status: JobStatus }) => void
}

function DetailCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onClose} className="xl:hidden">
        <ArrowLeft />
        Back
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="hidden xl:inline-flex"
        aria-label="Close opportunity"
      >
        <X />
      </Button>
    </>
  )
}

function FitMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={value === 'strong' ? 'secondary' : 'outline'} className="capitalize">
        {value}
      </Badge>
    </div>
  )
}

export function OpportunityDetail({
  jobId,
  isFullPage,
  onClose,
  onToggleFullPage,
  onJobUpdated,
}: OpportunityDetailProps) {
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [researching, setResearching] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [startingApplication, setStartingApplication] = useState(false)

  const { user } = useAuth()
  const {
    application,
    loading: applicationLoading,
  } = useJobApplication(jobId)
  const { analysis, loading: analysisLoading, refresh: refreshAnalysis } = useJobAnalysis(jobId)
  const { company, loading: companyLoading, refresh: refreshCompany } = useCompany(job?.companyId)
  const { projects } = useProjects()

  useEffect(() => {
    let active = true
    getJob(jobId)
      .then((data) => {
        if (active) setJob(data)
      })
      .catch(() => {
        if (active) setError('We couldn\u2019t load this opportunity.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [jobId])

  const matchedProjects = (analysis?.matchedProjectIds ?? [])
    .map((projectId) => projects.find((project) => project.id === projectId))
    .filter((project) => project !== undefined)

  async function runAnalyze() {
    setAnalyzing(true)
    try {
      const callable = httpsCallable<{ jobId: string }, { status: string }>(functions, 'analyzeJob')
      await callable({ jobId })
      await refreshAnalysis()
      const refreshed = await getJob(jobId)
      if (refreshed) {
        setJob(refreshed)
        onJobUpdated?.({ id: refreshed.id, status: refreshed.status })
      }
      toast('Analysis complete')
    } catch (analyzeError) {
      toast('Unable to analyze', {
        description: aiErrorMessage(analyzeError, 'Please try again.'),
      })
    } finally {
      setAnalyzing(false)
    }
  }

  async function runResearch() {
    setResearching(true)
    try {
      const callable = httpsCallable<{ jobId: string }, { companyId: string }>(functions, 'researchOpportunity')
      const response = await callable({ jobId })
      const companyId = response.data.companyId
      // refresh company data after research by re-reading the job
      const refreshed = await getJob(jobId)
      if (refreshed) {
        setJob({ ...refreshed, companyId: companyId || refreshed.companyId })
      }
      await refreshCompany()
      toast('Company research complete')
    } catch (researchError) {
      toast('Unable to research', {
        description: aiErrorMessage(researchError, 'Please try again.'),
      })
    } finally {
      setResearching(false)
    }
  }

  async function runStartApplication() {
    if (!job || !user) {
      return
    }
    setStartingApplication(true)
    try {
      const result = await createApplicationFromJob(user.uid, job.id)
      toast(result.existing ? 'Application already started' : 'Application started')
      navigate(`/app/applications/${result.id}`)
    } catch (startError) {
      toast('Unable to start the application', {
        description:
          startError instanceof Error ? startError.message : 'Please try again.',
      })
    } finally {
      setStartingApplication(false)
    }
  }

  async function runDraftOutreach() {
    setDrafting(true)
    try {
      const callable = httpsCallable<{ jobId: string }, { outreachId: string; existing: boolean }>(
        functions,
        'generatePitch',
      )
      const response = await callable({ jobId })
      toast(response.data.existing ? 'Outreach already drafted' : 'Outreach draft created')
      navigate(`/app/outreach/${response.data.outreachId}`)
    } catch (draftError) {
      toast('Unable to draft outreach', {
        description: aiErrorMessage(draftError, 'Cloud Functions are not available yet.'),
      })
    } finally {
      setDrafting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer
        title="Opportunity"
        actions={<DetailCloseButton onClose={onClose} />}
      >
        <LoadingState label="Loading opportunity…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !job) {
    return (
      <PageContainer
        title="Opportunity"
        actions={<DetailCloseButton onClose={onClose} />}
      >
        <EmptyState title={error ?? 'Opportunity not found'} description="It may have been removed." />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={job.title}
      description={`${job.companyName || 'Unknown company'} · ${job.remote ? 'Remote' : job.location || 'Location unknown'}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <DetailCloseButton onClose={onClose} />
          <Button variant="outline" size="sm" onClick={() => void runAnalyze()} disabled={analyzing}>
            <Sparkles />
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void runResearch()} disabled={researching}>
            {researching ? 'Researching…' : 'Company research'}
          </Button>
          <Button size="sm" onClick={() => void runDraftOutreach()} disabled={drafting}>
            <Mail />
            {drafting ? 'Drafting…' : 'Draft outreach'}
          </Button>
          {application ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/applications/${application.id}`)}
            >
              <ClipboardList />
              View application
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void runStartApplication()}
              disabled={startingApplication || applicationLoading || !job}
            >
              <ClipboardList />
              {startingApplication ? 'Starting…' : 'Start application'}
            </Button>
          )}
          <Button size="sm" variant="outline" render={<a href={job.applicationUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            Open source
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex"
            onClick={onToggleFullPage}
          >
            {isFullPage ? <Minimize2 /> : <Maximize2 />}
            {isFullPage ? 'Split view' : 'Full page'}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <Badge variant={job.status === 'qualified' ? 'secondary' : 'outline'}>
          {job.status}
        </Badge>
        {application && (
          <Badge variant="secondary">
            Application · {APPLICATION_STATUS_LABELS[application.status]}
          </Badge>
        )}
        <Badge variant="outline" className="capitalize">{SOURCE_LABELS[job.source] ?? job.source}</Badge>
        {SOURCE_ATTRIBUTION_URL[job.source] && (
          <a
            href={SOURCE_ATTRIBUTION_URL[job.source]}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            via {SOURCE_LABELS[job.source]}
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Why this opportunity fits</CardTitle>
        </CardHeader>
        <CardContent>
          {analysisLoading ? (
            <LoadingState label="Loading fit analysis…" rows={3} />
          ) : analysis ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-3xl font-bold text-foreground">
                  {analysis.fitScore ?? '—'}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
                </div>
                {analysis.recommendation && (
                  <Badge
                    variant={analysis.recommendation === 'pursue' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {analysis.recommendation}
                  </Badge>
                )}
              </div>
              <Separator />
              {analysis.roleType && (
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-sm text-muted-foreground">Role type</span>
                  <Badge variant="outline" className="capitalize">{analysis.roleType}</Badge>
                </div>
              )}
              <FitMetric label="Technical fit" value={analysis.technicalFit} />
              <FitMetric label="Experience fit" value={analysis.experienceFit} />
              {analysis.remoteFit && <FitMetric label="Remote fit" value={analysis.remoteFit} />}
              <Separator />
              <div>
                <div className="text-xs font-medium text-muted-foreground">Matched skills</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {analysis.matchedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[0.65rem]">{skill}</Badge>
                  ))}
                  {analysis.matchedSkills.length === 0 && (
                    <span className="text-sm text-muted-foreground">None identified</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Missing / concerns</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {analysis.missingSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[0.65rem]">{skill}</Badge>
                  ))}
                  {analysis.concerns.map((concern, index) => (
                    <Badge key={index} variant="outline" className="text-[0.65rem]">{concern}</Badge>
                  ))}
                  {analysis.missingSkills.length === 0 && analysis.concerns.length === 0 && (
                    <span className="text-sm text-muted-foreground">None identified</span>
                  )}
                </div>
              </div>
              {analysis.summary && (
                <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
              )}
            </div>
          ) : (
            <EmptyState
              title="Not analyzed yet"
              description="Run Analyze to see the fit evaluation."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            {job.description ? (
              job.description.split('\n').map((paragraph, index) =>
                paragraph.trim() ? (
                  <p key={index}>{paragraph}</p>
                ) : null,
              )
            ) : (
              <span className="text-muted-foreground">No description available.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Company research</CardTitle>
        </CardHeader>
        <CardContent>
          {companyLoading ? (
            <LoadingState label="Loading company research…" rows={2} />
          ) : company ? (
            <div className="flex flex-col gap-3 text-sm text-foreground">
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                  {company.website}
                </a>
              )}
              {company.industry && (
                <div>
                  <span className="font-medium text-muted-foreground">Industry:</span>{' '}
                  <span className="text-foreground">{company.industry}</span>
                </div>
              )}
              {company.product && (
                <div>
                  <span className="font-medium text-muted-foreground">Product/service:</span>{' '}
                  <span className="text-foreground">{company.product}</span>
                </div>
              )}
              {company.description && (
                <p className="leading-relaxed text-foreground">{company.description}</p>
              )}
              {company.roleContext && (
                <div className="rounded-md bg-muted/40 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Role context</div>
                  <p className="mt-1 leading-relaxed text-foreground">{company.roleContext}</p>
                </div>
              )}
              {company.hiringSignals.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Hiring signals</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {company.hiringSignals.map((signal, index) => (
                      <Badge key={index} variant="outline" className="text-[0.65rem]">{signal}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.researchSummary && (
                <div className="rounded-md bg-muted/40 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">AI summary</div>
                  <p className="mt-1 leading-relaxed text-foreground">{company.researchSummary}</p>
                </div>
              )}
              {company.sourceUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {company.sourceUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-4">
                      Source
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No research yet"
              description="Run company research to gather context."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Relevant projects</CardTitle>
        </CardHeader>
        <CardContent>
          {matchedProjects.length > 0 ? (
            <div className="flex flex-col gap-3">
              {matchedProjects.map((project) => (
                <div key={project.id} className="flex flex-col gap-1">
                  <Link to={`/app/projects`} className="font-medium text-foreground hover:underline">
                    {project.title}
                  </Link>
                  <div className="text-sm leading-relaxed text-foreground">{project.summary}</div>
                  {analysis?.projectMatchReasons?.[project.id] && (
                    <div className="text-xs leading-relaxed text-foreground/80">
                      {analysis.projectMatchReasons[project.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matched projects"
              description="Run Analyze to match verified portfolio projects."
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}