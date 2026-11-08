import { useMemo } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ExternalLink,
  FileText,
  LockKeyhole,
  MessageSquare,
  PenLine,
} from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import { ApplicationAnswersEditor } from '@/components/applications/preparation/ApplicationAnswersEditor'
import { CoverLetterEditor } from '@/components/applications/preparation/CoverLetterEditor'
import { PreparationContext } from '@/components/applications/preparation/PreparationContext'
import { PreparationReview } from '@/components/applications/preparation/PreparationReview'
import { ResumePreparation } from '@/components/applications/preparation/ResumePreparation'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useApplication } from '@/hooks/useApplication'
import { useApplicationPreparation } from '@/hooks/useApplicationPreparation'
import { useAuth } from '@/hooks/useAuth'
import { useCompany } from '@/hooks/useCompany'
import { useJob } from '@/hooks/useJob'
import { useJobAnalysis } from '@/hooks/useJobAnalysis'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useProfile } from '@/hooks/useProfile'
import { useProjects } from '@/hooks/useProjects'
import { useResumeVariants } from '@/hooks/useResumeVariants'
import { attachResumeToApplication } from '@/services/applicationResume'
import type { ApplicationResumeAttachment } from '@/services/applicationResumeService'
import {
  createEmptyPreparation,
  isPreparationReadOnly,
  preparationAnswerCount,
  preparationApprovedAnswerCount,
  preparationPendingItems,
} from '@/lib/applicationPreparation'
import { cn } from '@/lib/utils'
import type { ApplicationPreparation } from '@/types/applicationPreparation'

type PreparationSection =
  | 'context'
  | 'resume'
  | 'cover-letter'
  | 'answers'
  | 'review'

const SECTIONS: Array<{
  id: PreparationSection
  label: string
  icon: typeof Briefcase
}> = [
  { id: 'context', label: 'Context', icon: Briefcase },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'cover-letter', label: 'Cover letter', icon: PenLine },
  { id: 'answers', label: 'Answers', icon: MessageSquare },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
]

function sectionComplete(
  section: PreparationSection,
  preparation: ApplicationPreparation,
): boolean {
  switch (section) {
    case 'context':
      return true
    case 'resume':
      return preparation.resumeReviewed
    case 'cover-letter':
      return (
        !preparation.coverLetter.body.trim() ||
        preparation.coverLetter.status === 'approved'
      )
    case 'answers': {
      const count = preparationAnswerCount(preparation)
      return count === 0 || preparationApprovedAnswerCount(preparation) === count
    }
    case 'review':
      return preparationPendingItems(preparation).length === 0
  }
}

export function ApplicationPreparationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { application, loading: applicationLoading, error, refresh: refreshApplication } =
    useApplication(id)
  const {
    preparation,
    loading: preparationLoading,
    error: preparationError,
    refresh: refreshPreparation,
    save,
  } = useApplicationPreparation(id)
  const { job } = useJob(application?.jobId)
  const { analysis } = useJobAnalysis(application?.jobId)
  const { company } = useCompany(application?.companyId)
  const { profile } = useProfile()
  const { projects } = useProjects()
  const { variants } = useResumeVariants()

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const activeSection: PreparationSection = SECTIONS.some(
    (section) => section.id === tab,
  )
    ? (tab as PreparationSection)
    : 'context'

  function setActiveSection(section: PreparationSection) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', section)
    setSearchParams(next, { replace: true })
  }

  usePageMeta({
    title: application
      ? `Prepare ${application.jobTitle} — Victor Job OS`
      : 'Application preparation — Victor Job OS',
    description: 'Prepare a resume, cover letter, and application answers for one role.',
    noindex: true,
    path: `/app/applications/${id ?? ''}/prepare`,
  })

  const from = (location.state as { from?: unknown } | null)?.from
  const returnTo = typeof from === 'string' ? from : undefined

  const effectivePreparation = useMemo(() => {
    if (preparation) return preparation
    if (!user || !application) return null
    return createEmptyPreparation(user.uid, application.id)
  }, [preparation, user, application])

  function goBack() {
    if (returnTo) {
      navigate(-1)
      return
    }
    if (application) {
      navigate(`/app/applications?application=${encodeURIComponent(application.id)}`)
      return
    }
    navigate('/app/applications')
  }

  async function attachResume(attachment: ApplicationResumeAttachment) {
    if (!user || !application) {
      throw new Error('Sign in required to attach a resume.')
    }
    await attachResumeToApplication(user.uid, application.id, attachment)
    await Promise.all([refreshPreparation(), refreshApplication()])
  }

  if (!id) {
    return <Navigate to="/app/applications" replace />
  }

  if (applicationLoading || preparationLoading) {
    return (
      <PageContainer title="Prepare application">
        <LoadingState label="Loading preparation workspace…" rows={6} />
      </PageContainer>
    )
  }

  if (error || !application) {
    return (
      <PageContainer title="Prepare application">
        <EmptyState
          title={error ?? 'Application not found'}
          description="It may have been removed, or the link is incorrect."
          action={
            <Button variant="outline" size="sm" render={<Link to="/app/applications" />}>
              Back to applications
            </Button>
          }
        />
      </PageContainer>
    )
  }

  if (!effectivePreparation) {
    return (
      <PageContainer title="Prepare application">
        <LoadingState label="Loading your preparation…" rows={4} />
      </PageContainer>
    )
  }

  const readOnly = isPreparationReadOnly(application.status)

  return (
    <PageContainer
      title="Prepare application"
      description={`${application.jobTitle} · ${application.companyName || 'Unknown company'}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft />
            Back to application
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
              Open application
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <ApplicationStatusBadge
          status={application.status}
          outcome={application.outcome}
        />
        <Badge variant="outline">Preparation workspace</Badge>
        {readOnly && (
          <Badge variant="secondary" className="gap-1.5">
            <LockKeyhole className="size-3" />
            Read-only
          </Badge>
        )}
      </div>

      {preparationError && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          {preparationError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-6">
          <div className="text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Preparation steps
          </div>
          <nav
            aria-label="Preparation steps"
            className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
          >
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const active = activeSection === section.id
              const complete = sectionComplete(section.id, effectivePreparation)
              return (
                <Button
                  key={section.id}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'shrink-0 justify-start gap-2 lg:w-full',
                    active && 'font-semibold',
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon className="size-4" />
                  <span className="truncate">{section.label}</span>
                  {complete ? (
                    <CheckCircle2 className="ml-auto size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="ml-auto size-3 shrink-0 text-muted-foreground/50" />
                  )}
                </Button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {activeSection === 'context' && (
            <PreparationContext
              application={application}
              job={job}
              analysis={analysis}
              company={company}
              projects={projects}
            />
          )}
          {activeSection === 'resume' && (
            <ResumePreparation
              applicationId={application.id}
              preparation={effectivePreparation}
              applicationResumeUrl={application.resumeUrl}
              applicationResumeVariantId={application.resumeVariantId}
              applicationResumeVariantName={application.resumeVariantName}
              profileResumeUrl={profile?.resumeUrl}
              variants={variants}
              readOnly={readOnly}
              onSave={save}
              onAttachResume={attachResume}
            />
          )}
          {activeSection === 'cover-letter' && (
            <CoverLetterEditor
              applicationId={application.id}
              preparation={effectivePreparation}
              readOnly={readOnly}
              onSave={save}
              onRefresh={refreshPreparation}
            />
          )}
          {activeSection === 'answers' && (
            <ApplicationAnswersEditor
              applicationId={application.id}
              preparation={effectivePreparation}
              readOnly={readOnly}
              onSave={save}
              onRefresh={refreshPreparation}
              atsQuestions={application.atsMetadata?.questions ?? []}
            />
          )}
          {activeSection === 'review' && (
            <PreparationReview
              application={application}
              preparation={effectivePreparation}
              onChanged={refreshApplication}
            />
          )}
        </div>
      </div>
    </PageContainer>
  )
}
