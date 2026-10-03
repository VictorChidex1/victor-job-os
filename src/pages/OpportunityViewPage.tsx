import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
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
import type { Job } from '@/types/jobs'

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

export function OpportunityViewPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [researching, setResearching] = useState(false)

  const { analysis, loading: analysisLoading } = useJobAnalysis(id)
  const { company, loading: companyLoading } = useCompany(job?.companyId)
  const { projects } = useProjects()

  useEffect(() => {
    if (!id) {
      return
    }
    let active = true
    getJob(id)
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
  }, [id])

  const matchedProjects = (analysis?.matchedProjectIds ?? [])
    .map((projectId) => projects.find((project) => project.id === projectId))
    .filter((project) => project !== undefined)

  if (!id) {
    return (
      <PageContainer title="Opportunity">
        <EmptyState title="No opportunity selected" />
      </PageContainer>
    )
  }

  const jobId = id

  async function runAnalyze() {
    setAnalyzing(true)
    try {
      const callable = httpsCallable<{ jobId: string }, { status: string }>(functions, 'analyzeJob')
      await callable({ jobId })
      toast('Analysis complete')
    } catch {
      toast('Unable to analyze', { description: 'Check your Gemini API key in functions/.env.' })
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
      toast('Company research complete')
    } catch {
      toast('Unable to research', { description: 'Check your Gemini API key in functions/.env.' })
    } finally {
      setResearching(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Opportunity">
        <LoadingState label="Loading opportunity…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !job) {
    return (
      <PageContainer title="Opportunity">
        <EmptyState title={error ?? 'Opportunity not found'} description="It may have been removed." />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={job.title}
      description={`${job.companyName || 'Unknown company'} · ${job.remote ? 'Remote' : job.location || 'Location unknown'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void runAnalyze()} disabled={analyzing}>
            <Sparkles />
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void runResearch()} disabled={researching}>
            {researching ? 'Researching…' : 'Company research'}
          </Button>
          <Button size="sm" variant="outline" render={<a href={job.applicationUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            Open source
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <Link to="/app/opportunities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Opportunities
        </Link>
        <Badge variant={job.status === 'qualified' ? 'secondary' : 'outline'}>
          {job.status}
        </Badge>
        <Badge variant="outline" className="capitalize">{job.source}</Badge>
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
              <div className="text-3xl font-bold text-foreground">
                {analysis.fitScore ?? '—'}
                <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
              </div>
              <Separator />
              <FitMetric label="Technical fit" value={analysis.technicalFit} />
              <FitMetric label="Experience fit" value={analysis.experienceFit} />
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
                <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
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
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground">
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
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                  {company.website}
                </a>
              )}
              {company.industry && <div><span className="font-medium text-foreground">Industry:</span> {company.industry}</div>}
              {company.description && <p>{company.description}</p>}
              {company.researchSummary && (
                <div className="rounded-md bg-muted/40 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">AI summary</div>
                  <p className="mt-1">{company.researchSummary}</p>
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
                  <div className="text-sm text-muted-foreground">{project.summary}</div>
                  {analysis?.projectMatchReasons?.[project.id] && (
                    <div className="text-xs text-muted-foreground">
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