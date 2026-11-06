import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, Plus, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import { LoadingState } from '@/components/states/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { usePageMeta } from '@/hooks/usePageMeta'
import { normalizeResumeUrl } from '@/lib/resume'
import { attachResumeToApplication } from '@/services/applicationResume'
import type { VerificationEntry, VerificationStatus } from '@/types/profile'

const verificationSchema = z.object({
  value: z.string().min(1),
  status: z.enum(['verified', 'needs-verification']),
})

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  headline: z.string().min(1, 'Headline is required'),
  summary: z.string().min(1, 'Summary is required'),
  skills: z.array(verificationSchema),
  technologies: z.array(verificationSchema),
  preferredRoles: z.array(z.string()),
  preferredLocations: z.array(z.string()),
  remotePreference: z.boolean(),
  experienceLevel: z.string(),
  resumeUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => !value?.trim() || normalizeResumeUrl(value) !== null,
      'Enter a valid resume URL',
    ),
  portfolioUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const defaultValues: ProfileFormValues = {
  fullName: '',
  headline: '',
  summary: '',
  skills: [],
  technologies: [],
  preferredRoles: [],
  preferredLocations: [],
  remotePreference: true,
  experienceLevel: '',
  resumeUrl: '',
  portfolioUrl: '',
  email: '',
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  return status === 'verified' ? (
    <Badge variant="secondary" className="text-[0.6rem]">Verified</Badge>
  ) : (
    <Badge variant="outline" className="text-[0.6rem]">Needs verification</Badge>
  )
}

function VerifiableTagsField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: VerificationEntry[]
  onChange: (next: VerificationEntry[]) => void
  hint?: string
}) {
  const [draft, setDraft] = useState('')

  function updateItem(index: number, patch: Partial<VerificationEntry>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addItem() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...value, { value: trimmed, status: 'needs-verification' }])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={`Add ${label.toLowerCase()}…`}
          aria-label={`Add ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem()
            }
          }}
        />
        <Button type="button" size="sm" onClick={addItem} disabled={!draft.trim()}>
          <Plus />
          Add
        </Button>
      </div>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {value.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={entry.value}
                aria-label={`${label} name`}
                onChange={(event) => updateItem(index, { value: event.target.value })}
              />
              <Switch
                checked={entry.status === 'verified'}
                onCheckedChange={(checked) =>
                  updateItem(index, { status: checked ? 'verified' : 'needs-verification' })
                }
                aria-label={`${entry.value} verification`}
              />
              <VerificationBadge status={entry.status} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${entry.value}`}
                onClick={() => removeItem(index)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StringArrayField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  function updateItem(index: number, next: string) {
    onChange(value.map((item, i) => (i === index ? next : item)))
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addItem() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...value, trimmed])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          aria-label={`Add ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem()
            }
          }}
        />
        <Button type="button" size="sm" onClick={addItem} disabled={!draft.trim()}>
          <Plus />
          Add
        </Button>
      </div>
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                placeholder={placeholder}
                aria-label={`${label} ${index + 1}`}
                onChange={(event) => updateItem(index, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item}`}
                onClick={() => removeItem(index)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const linkedApplicationId = searchParams.get('applicationId')?.trim() || undefined
  const [resumeSaving, setResumeSaving] = useState(false)

  const stateFrom = (location.state as { from?: unknown } | null)?.from
  const returnTo =
    typeof stateFrom === 'string'
      ? stateFrom
      : linkedApplicationId
        ? `/app/applications/${encodeURIComponent(linkedApplicationId)}/prepare?tab=resume`
        : undefined

  usePageMeta({
    title: 'Profile — Victor Job OS',
    description: 'Manage your professional profile, skills, and preferences.',
    noindex: true,
    path: '/app/profile',
  })
  const { profile, loading, saving, save } = useProfile()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills,
        technologies: profile.technologies,
        preferredRoles: profile.preferredRoles,
        preferredLocations: profile.preferredLocations,
        remotePreference: profile.remotePreference,
        experienceLevel: profile.experienceLevel,
        resumeUrl: profile.resumeUrl ?? '',
        portfolioUrl: profile.portfolioUrl ?? '',
        email: profile.email,
      })
    }
  }, [profile, form])

  function onInvalid() {
    toast('Please fix the highlighted profile fields before saving.')
  }

  async function attachSavedResume(resumeUrl: string): Promise<boolean> {
    if (!linkedApplicationId || !user || !resumeUrl) {
      return false
    }
    try {
      await attachResumeToApplication(user.uid, linkedApplicationId, resumeUrl)
      return true
    } catch (error) {
      toast('Resume saved to Profile', {
        description:
          error instanceof Error
            ? `It could not be attached to this application: ${error.message}`
            : 'It could not be attached to this application.',
      })
      return false
    }
  }

  async function saveResume(returnToApplication: boolean): Promise<boolean> {
    const normalized = normalizeResumeUrl(form.getValues('resumeUrl'))
    if (normalized === null) {
      form.setError('resumeUrl', {
        type: 'manual',
        message: 'Enter a valid resume URL',
      })
      toast('Invalid resume URL', {
        description:
          'Use an http(s) link, or enter a domain such as example.com/resume.pdf.',
      })
      return false
    }
    if (!normalized) {
      form.setError('resumeUrl', {
        type: 'manual',
        message: 'Enter a resume URL first',
      })
      toast('Add a resume URL first')
      return false
    }

    setResumeSaving(true)
    try {
      await save({ resumeUrl: normalized })
      form.setValue('resumeUrl', normalized, {
        shouldDirty: false,
        shouldValidate: true,
      })
      const attached = await attachSavedResume(normalized)
      if (attached) {
        toast('Resume saved and attached to this application')
      } else if (!linkedApplicationId) {
        toast('Resume saved to Profile')
      }

      if (returnToApplication) {
        if (typeof stateFrom === 'string') {
          navigate(-1)
        } else if (linkedApplicationId) {
          navigate(
            `/app/applications/${encodeURIComponent(linkedApplicationId)}/prepare?tab=resume`,
          )
        }
      }
      return true
    } catch {
      toast('Unable to save the resume', { description: 'Please try again.' })
      return false
    } finally {
      setResumeSaving(false)
    }
  }

  function handleBack() {
    const currentResume = form.getValues('resumeUrl')?.trim() ?? ''
    const hasUnsavedResume =
      Boolean(linkedApplicationId) &&
      Boolean(currentResume) &&
      currentResume !== (profile?.resumeUrl ?? '')

    if (hasUnsavedResume) {
      void saveResume(true)
      return
    }

    if (typeof stateFrom === 'string') {
      navigate(-1)
    } else if (returnTo) {
      navigate(returnTo)
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    const normalizedResumeUrl = normalizeResumeUrl(values.resumeUrl)
    if (normalizedResumeUrl === null) {
      form.setError('resumeUrl', {
        type: 'manual',
        message: 'Enter a valid resume URL',
      })
      toast('Invalid resume URL', {
        description:
          'Use an http(s) link, or enter a domain such as example.com/resume.pdf.',
      })
      return
    }

    const nextValues = {
      ...values,
      resumeUrl: normalizedResumeUrl,
    }

    try {
      await save(nextValues)
      const attached = await attachSavedResume(normalizedResumeUrl)
      if (attached) {
        toast('Profile saved', {
          description: 'Your resume was attached to this application.',
        })
      } else {
        toast('Profile saved', { description: 'Your professional profile was updated.' })
      }
      form.setValue('resumeUrl', normalizedResumeUrl, {
        shouldDirty: false,
        shouldValidate: true,
      })
    } catch {
      toast('Unable to save', { description: 'Please try again.' })
    }
  }

  if (loading) {
    return (
      <PageContainer title="Profile">
        <LoadingState label="Loading profile…" rows={4} />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Profile"
      description="This information is used to qualify opportunities and generate applications."
      actions={
        returnTo ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={resumeSaving}
          >
            <ArrowLeft />
            {resumeSaving ? 'Saving resume…' : 'Back to resume preparation'}
          </Button>
        ) : undefined
      }
    >
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-4"
      >
        <Section title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="fullName"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" {...field} aria-invalid={!!form.formState.errors.fullName} />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="headline"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="headline">Headline</Label>
                  <Input id="headline" {...field} aria-invalid={!!form.formState.errors.headline} />
                  {form.formState.errors.headline && (
                    <p className="text-sm text-destructive">{form.formState.errors.headline.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...field} aria-invalid={!!form.formState.errors.email} />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="portfolioUrl"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                  <Input id="portfolioUrl" {...field} aria-invalid={!!form.formState.errors.portfolioUrl} />
                  {form.formState.errors.portfolioUrl && (
                    <p className="text-sm text-destructive">{form.formState.errors.portfolioUrl.message}</p>
                  )}
                </div>
              )}
            />
          </div>
        </Section>

        <Section title="Resume">
          <Controller
            name="resumeUrl"
            control={form.control}
            render={({ field }) => {
              const savedResumeUrl = profile?.resumeUrl ?? ''
              const hasUnsavedResume =
                Boolean(field.value?.trim()) &&
                field.value?.trim() !== savedResumeUrl.trim()

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                      id="resumeUrl"
                      type="text"
                      inputMode="url"
                      placeholder="https://example.com/resume.pdf"
                      {...field}
                      aria-invalid={!!form.formState.errors.resumeUrl}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    This is the resume attached to applications you prepare. Keeping it current
                    makes the application resume step faster.
                  </p>
                  {linkedApplicationId && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Saving this profile will attach the resume URL to the application you opened
                      from preparation. Use the save button below to attach it and return.
                    </p>
                  )}
                  {savedResumeUrl && (
                    <a
                      href={savedResumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-1 text-xs text-primary underline underline-offset-4"
                    >
                      Open current resume
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  {hasUnsavedResume && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-300">
                      Unsaved resume changes
                    </p>
                  )}
                  {form.formState.errors.resumeUrl && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.resumeUrl.message}
                    </p>
                  )}
                  {linkedApplicationId && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void saveResume(true)}
                        disabled={resumeSaving || saving}
                      >
                        <Save />
                        {resumeSaving ? 'Saving resume…' : 'Save resume & return'}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Saves the resume without changing your other profile fields.
                      </span>
                    </div>
                  )}
                </div>
              )
            }}
          />
        </Section>

        <Section title="Professional summary">
          <Controller
            name="summary"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" rows={5} {...field} aria-invalid={!!form.formState.errors.summary} />
                {form.formState.errors.summary && (
                  <p className="text-sm text-destructive">{form.formState.errors.summary.message}</p>
                )}
              </div>
            )}
          />
        </Section>

        <Section title="Skills and technologies">
          <Controller
            name="skills"
            control={form.control}
            render={({ field }) => (
              <VerifiableTagsField
                label="Skills"
                value={field.value}
                onChange={field.onChange}
                hint="Verified skills are used as evidence in outreach and applications."
              />
            )}
          />
          <Separator />
          <Controller
            name="technologies"
            control={form.control}
            render={({ field }) => (
              <VerifiableTagsField
                label="Technologies"
                value={field.value}
                onChange={field.onChange}
                hint="Verified technologies are treated as factual evidence."
              />
            )}
          />
        </Section>

        <Section title="Preferences">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="preferredRoles"
              control={form.control}
              render={({ field }) => (
                <StringArrayField
                  label="Preferred roles"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g. Senior React Engineer"
                />
              )}
            />
            <Controller
              name="preferredLocations"
              control={form.control}
              render={({ field }) => (
                <StringArrayField
                  label="Preferred locations"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g. Remote, Lagos"
                />
              )}
            />
          </div>
          <Controller
            name="experienceLevel"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="experienceLevel">Experience level</Label>
                <Input
                  id="experienceLevel"
                  {...field}
                  placeholder="e.g. Senior, 5+ years"
                  aria-invalid={!!form.formState.errors.experienceLevel}
                />
              </div>
            )}
          />
          <Controller
            name="remotePreference"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="remotePreference">Prefer remote</Label>
                  <p className="text-xs text-muted-foreground">
                    Remote opportunities are prioritized.
                  </p>
                </div>
                <Switch
                  id="remotePreference"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </Section>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={saving}>
            Discard changes
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}