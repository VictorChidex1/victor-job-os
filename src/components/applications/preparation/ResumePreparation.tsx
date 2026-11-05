import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, FileText } from 'lucide-react'
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
  preparation,
  resumeUrl,
  readOnly,
  onSave,
}: {
  preparation: ApplicationPreparation
  resumeUrl?: string
  readOnly: boolean
  onSave: (patch: {
    resumeNotes: string
    resumeReviewed: boolean
  }) => Promise<void>
}) {
  const [notes, setNotes] = useState(preparation.resumeNotes)
  const [reviewed, setReviewed] = useState(preparation.resumeReviewed)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setNotes(preparation.resumeNotes)
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setReviewed(preparation.resumeReviewed)
  }, [preparation.resumeNotes, preparation.resumeReviewed])

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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" />
            Current resume
          </CardTitle>
          <CardDescription>
            Use your profile resume while preparing this application. Resume variants and
            tailored versions arrive in item 59.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resumeUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              render={<a href={resumeUrl} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink />
              Open current resume
            </Button>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                No resume URL is saved on your profile yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                render={<Link to="/app/profile" />}
              >
                Add a resume in Profile
              </Button>
            </div>
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

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Resume variants are next.</span>{' '}
        Item 58 keeps the resume step honest: link the current resume, record tailoring notes,
        and mark it reviewed. The variant system will build on this step.
      </div>
    </div>
  )
}
