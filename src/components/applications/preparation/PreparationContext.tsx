import { Link } from 'react-router'
import {
  Briefcase,
  Building2,
  ExternalLink,
  FolderKanban,
  Sparkles,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { Application } from '@/types/applications'
import type { Company } from '@/types/companies'
import type { Job, JobAnalysis } from '@/types/jobs'
import type { PortfolioProject } from '@/types/projects'

export function PreparationContext({
  application,
  job,
  analysis,
  company,
  projects,
}: {
  application: Application
  job: Job | null
  analysis: JobAnalysis | null
  company: Company | null
  projects: PortfolioProject[]
}) {
  const matchedProjects = analysis?.matchedProjectIds?.length
    ? projects.filter((project) => analysis.matchedProjectIds?.includes(project.id))
    : []

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-primary" />
            Application context
          </CardTitle>
          <CardDescription>
            The role and company snapshot this preparation is built around.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Role
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {application.jobTitle || 'Untitled role'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Company
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {application.companyName || 'Unknown company'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </div>
              <div className="mt-1 text-sm text-foreground">
                {application.location || (application.remote ? 'Remote' : 'Not specified')}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Source
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[0.65rem]">
                  {SOURCE_LABELS[application.jobSource] ?? application.jobSource}
                </Badge>
                {application.remote && <Badge variant="secondary">Remote</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link to={`/app/opportunities?job=${encodeURIComponent(application.jobId)}`} />
              }
            >
              <ExternalLink />
              Open opportunity
            </Button>
            {application.applicationUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={application.applicationUrl} target="_blank" rel="noreferrer" />
                }
              >
                <ExternalLink />
                Open employer application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="size-4 text-primary" />
            Role details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {job?.description ? (
            <>
              <p className="max-h-64 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Showing the sanitized plain-text description from the source opportunity.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              The source opportunity description is no longer available. You can still write
              preparation content manually.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            Fit analysis and evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {analysis ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {typeof analysis.fitScore === 'number' && (
                  <Badge variant="secondary">Fit {analysis.fitScore}%</Badge>
                )}
                <Badge variant="outline">{analysis.recommendation}</Badge>
                <Badge variant="outline">{analysis.roleType}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {analysis.summary}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Matched skills
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.matchedSkills.length ? (
                      analysis.matchedSkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="font-normal">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None identified</span>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Gaps or concerns
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.missingSkills.length || analysis.concerns.length ? (
                      [...analysis.missingSkills, ...analysis.concerns].map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-300"
                        >
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None identified</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No fit analysis is available for this opportunity yet. You can still prepare
              manually or analyze it from Opportunities.
            </p>
          )}

          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <FolderKanban className="size-3.5" />
              Matched projects
            </div>
            {matchedProjects.length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {matchedProjects.map((project) => (
                  <div key={project.id} className="rounded-lg border bg-card p-3">
                    <div className="text-sm font-medium text-foreground">{project.title}</div>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {analysis?.projectMatchReasons?.[project.id] || project.summary}
                    </p>
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
                      >
                        View project
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No matched projects yet. Project evidence is used by the AI when available.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-primary" />
            Company research
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {company?.researchSummary || company?.description ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {company.researchSummary || company.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {company.industry && <Badge variant="outline">{company.industry}</Badge>}
                {company.product && (
                  <Badge variant="outline" className="max-w-full truncate">
                    {company.product}
                  </Badge>
                )}
              </div>
              {company.roleContext && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Role context: </span>
                  {company.roleContext}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No company research is available yet. Research the company from the company
              workspace or continue with the information you have.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
