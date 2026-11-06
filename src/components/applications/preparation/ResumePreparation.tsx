import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, FileText, Link2, Plus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ApplicationResumeAttachment } from '@/services/applicationResumeService'
import type { ApplicationPreparation } from '@/types/applicationPreparation'
import type { ResumeVariant } from '@/types/resumeVariants'

const PROFILE_RESUME = 'profile'

export function ResumePreparation({
  applicationId,
  preparation,
  applicationResumeUrl,
  applicationResumeVariantId,
  applicationResumeVariantName,
  profileResumeUrl,
  variants,
  readOnly,
  onSave,
  onAttachResume,
}: {
  applicationId: string
  preparation: ApplicationPreparation
  applicationResumeUrl?: string
  applicationResumeVariantId?: string
  applicationResumeVariantName?: string
  profileResumeUrl?: string
  variants: ResumeVariant[]
  readOnly: boolean
  onSave: (patch: {
    resumeNotes: string
    resumeReviewed: boolean
  }) => Promise<void>
  onAttachResume: (attachment: ApplicationResumeAttachment) => Promise<void>
}) {
  const [notes, setNotes] = useState(preparation.resumeNotes)
  const [reviewed, setReviewed] = useState(preparation.resumeReviewed)
  const [saving, setSaving] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [selectedResume, setSelectedResume] = useState('')

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setNotes(preparation.resumeNotes)
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setReviewed(preparation.resumeReviewed)
  }, [preparation.resumeNotes, preparation.resumeReviewed])

  const attachedVariantId =
    preparation.resumeVariantId ?? applicationResumeVariantId ?? ''
  const attachedVariantName =
    preparation.resumeVariantName ?? applicationResumeVariantName ?? ''
  const attachedResumeUrl = preparation.resumeUrl || applicationResumeUrl || ''
  const displayResumeUrl = attachedResumeUrl || profileResumeUrl || ''
  const usingProfileFallback = !attachedResumeUrl && Boolean(profileResumeUrl)
  const profileHref = `/app/profile?applicationId=${encodeURIComponent(applicationId)}`
  const profileState = {
    from: `/app/applications/${encodeURIComponent(applicationId)}/prepare?tab=resume`,
  }

  useEffect(() => {
    const defaultVariant = variants.find((variant) => variant.isDefault)
    const attachedVariantExists = variants.some(
      (variant) => variant.id === attachedVariantId,
    )
    const attachedIsProfile = Boolean(attachedResumeUrl && !attachedVariantId)
    const suggested =
      (attachedVariantExists ? attachedVariantId : '') ||
      (attachedIsProfile
        ? PROFILE_RESUME
        : defaultVariant?.id ||
          (usingProfileFallback ? PROFILE_RESUME : variants[0]?.id ?? PROFILE_RESUME))
    // oxlint-disable-next-line react/set-state-in-effect -- keep selector in sync after preparation refresh
    setSelectedResume(suggested)
  }, [attachedResumeUrl, attachedVariantId, usingProfileFallback, variants])

  async function save() {
    setSaving(true)
    try {
      await onSave({ resumeNotes: notes, resumeReviewed: reviewed })
      toast('Resume preparation saved')
    } catch {
      toast('Unable to save resume preparation')
    } finally {
      setSaving(false)
    }
  }

  async function applyResume() {
    if (selectedResume === PROFILE_RESUME) {
      if (!profileResumeUrl) {
        toast('Add a resume URL to your Profile first')
        return
      }
      setAttaching(true)
      try {
        await onAttachResume({ resumeUrl: profileResumeUrl })
        toast('Profile resume attached to this application')
      } catch {
        toast('Unable to attach the profile resume')
      } finally {
        setAttaching(false)
      }
      return
    }

    const variant = variants.find((item) => item.id === selectedResume)
    if (!variant) {
      toast('Choose a resume variant first')
      return
    }

    setAttaching(true)
    try {
      await onAttachResume({
        resumeUrl: variant.resumeUrl,
        resumeVariantId: variant.id,
        resumeVariantName: variant.name,
      })
      toast(`${variant.name} attached to this application`)
    } catch {
      toast('Unable to attach the resume variant')
    } finally {
      setAttaching(false)
    }
  }

  const hasOptions = Boolean(profileResumeUrl) || variants.length > 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" />
            Resume for this application
          </CardTitle>
          <CardDescription>
            The resume attached here is a snapshot for this application. Choose a named
            variant or use the current Profile resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {displayResumeUrl ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {usingProfileFallback ? 'Profile resume available' : 'Attached resume'}
                </div>
                {attachedVariantName && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="size-3" />
                    {attachedVariantName}
                  </Badge>
                )}
              </div>
              <a
                href={displayResumeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-sm text-primary underline underline-offset-4"
              >
                {displayResumeUrl}
              </a>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={displayResumeUrl} target="_blank" rel="noreferrer" />
                  }
                >
                  <ExternalLink />
                  Open resume
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                No resume is attached to this application yet.
              </p>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  render={<Link to={profileHref} state={profileState} />}
                >
                  <Plus />
                  Add a resume in Profile
                </Button>
              )}
            </div>
          )}

          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              render={<Link to={profileHref} state={profileState} />}
            >
              <ExternalLink />
              {displayResumeUrl ? 'Edit resume in Profile' : 'Open Profile'}
            </Button>
          )}

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
            <div>
              <Label htmlFor="resume-reviewed">Resume reviewed</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Confirm that the resume you plan to submit is the right one for this role.
              </p>
            </div>
            <Switch
              id="resume-reviewed"
              checked={reviewed}
              onCheckedChange={setReviewed}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Star className="size-4 text-primary" />
            Resume variants
          </CardTitle>
          <CardDescription>
            The default variant is a suggestion and is never attached automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {hasOptions ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={selectedResume}
                onValueChange={(value) => setSelectedResume(value ?? '')}
                disabled={readOnly || attaching}
              >
                <SelectTrigger className="w-full sm:max-w-sm">
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {profileResumeUrl && (
                    <SelectItem value={PROFILE_RESUME}>Profile resume</SelectItem>
                  )}
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                      {variant.isDefault ? ' (default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => void applyResume()}
                disabled={readOnly || attaching || !selectedResume}
              >
                <Link2 />
                {attaching ? 'Attaching…' : 'Use selected resume'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No resume variants yet. Create one from the Resumes page, or add a resume URL to
              your Profile.
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            render={<Link to="/app/resumes" />}
          >
            Manage resume variants
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tailoring notes</CardTitle>
          <CardDescription>
            Capture anything you want to remember when you tailor the resume later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="resume-notes">Notes</Label>
          <Textarea
            id="resume-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Emphasize the Firebase migration and the measurable latency improvement."
            className="min-h-32"
            disabled={readOnly}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => void save()} disabled={readOnly || saving}>
              {saving ? 'Saving…' : 'Save resume notes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
