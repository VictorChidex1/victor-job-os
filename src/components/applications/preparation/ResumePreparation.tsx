import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, FileText, Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ApplicationPreparation } from '@/types/applicationPreparation'

export function ResumePreparation({
  applicationId,
  preparation,
  applicationResumeUrl,
  profileResumeUrl,
  readOnly,
  onSave,
  onAttachResume,
}: {
  applicationId: string
  preparation: ApplicationPreparation
  applicationResumeUrl?: string
  profileResumeUrl?: string
  readOnly: boolean
  onSave: (patch: {
    resumeNotes: string
    resumeReviewed: boolean
  }) => Promise<void>
  onAttachResume: (resumeUrl: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(preparation.resumeNotes)
  const [reviewed, setReviewed] = useState(preparation.resumeReviewed)
  const [saving, setSaving] = useState(false)
  const [attaching, setAttaching] = useState(false)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setNotes(preparation.resumeNotes)
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setReviewed(preparation.resumeReviewed)
  }, [preparation.resumeNotes, preparation.resumeReviewed])

  const attachedResumeUrl = preparation.resumeUrl || applicationResumeUrl || ''
  const displayResumeUrl = attachedResumeUrl || profileResumeUrl || ''
  const usingProfileFallback = !attachedResumeUrl && Boolean(profileResumeUrl)
  const profileHref = `/app/profile?applicationId=${encodeURIComponent(applicationId)}`
  const profileState = {
    from: `/app/applications/${encodeURIComponent(applicationId)}/prepare?tab=resume`,
  }

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

  async function attachProfileResume() {
    if (!profileResumeUrl) return
    setAttaching(true)
    try {
      await onAttachResume(profileResumeUrl)
      toast('Profile resume attached to this application')
    } catch {
      toast('Unable to attach the profile resume')
    } finally {
      setAttaching(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" />
            Resume for this application
          </CardTitle>
          <CardDescription>
            The resume attached here is a snapshot for this application. Resume variants and
            tailored versions arrive in item 59.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {displayResumeUrl ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {usingProfileFallback ? 'Profile resume available' : 'Attached resume'}
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
                {usingProfileFallback && !readOnly && (
                  <Button
                    size="sm"
                    onClick={() => void attachProfileResume()}
                    disabled={attaching}
                  >
                    <Link2 />
                    {attaching ? 'Attaching…' : 'Use this resume for this application'}
                  </Button>
                )}
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
