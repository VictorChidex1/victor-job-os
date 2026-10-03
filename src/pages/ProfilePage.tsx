import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
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
import { useProfile } from '@/hooks/useProfile'
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
        portfolioUrl: profile.portfolioUrl ?? '',
        email: profile.email,
      })
    }
  }, [profile, form])

  async function onSubmit(values: ProfileFormValues) {
    try {
      await save(values)
      toast('Profile saved', { description: 'Your professional profile was updated.' })
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
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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