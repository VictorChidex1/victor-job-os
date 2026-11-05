import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { RotateCcw, Sparkles, WandSparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PreparationStatusBadge } from '@/components/applications/preparation/PreparationStatusBadge'
import { aiErrorMessage } from '@/lib/ai-errors'
import { functions } from '@/services/functions'
import type {
  ApplicationPreparation,
  CoverLetterDraft,
} from '@/types/applicationPreparation'

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function CoverLetterEditor({
  applicationId,
  preparation,
  readOnly,
  onSave,
  onRefresh,
}: {
  applicationId: string
  preparation: ApplicationPreparation
  readOnly: boolean
  onSave: (patch: { coverLetter: CoverLetterDraft }) => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const [body, setBody] = useState(preparation.coverLetter.body)
  const [busy, setBusy] = useState<'save' | 'approve' | 'generate' | null>(null)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setBody(preparation.coverLetter.body)
  }, [preparation.coverLetter.body])

  const coverLetter = preparation.coverLetter
  const dirty = body !== coverLetter.body
  const canApprove = body.trim().length > 0 && !readOnly

  function draftWithStatus(status: CoverLetterDraft['status']): CoverLetterDraft {
    return {
      ...coverLetter,
      body: body.trim(),
      draftBody: coverLetter.draftBody,
      status,
    }
  }

  async function save() {
    if (!body.trim()) {
      toast('Write or generate a cover letter first')
      return
    }
    setBusy('save')
    try {
      const status =
        coverLetter.status === 'approved' || coverLetter.status === 'empty'
          ? 'draft'
          : coverLetter.status
      await onSave({ coverLetter: draftWithStatus(status) })
      toast('Cover letter saved')
    } catch {
      toast('Unable to save the cover letter')
    } finally {
      setBusy(null)
    }
  }

  async function approve() {
    if (!body.trim()) {
      toast('Write or generate a cover letter first')
      return
    }
    setBusy('approve')
    try {
      await onSave({ coverLetter: draftWithStatus('approved') })
      toast('Cover letter approved')
    } catch {
      toast('Unable to approve the cover letter')
    } finally {
      setBusy(null)
    }
  }

  async function generate() {
    if (
      body.trim() &&
      !window.confirm('Replace the current cover letter with a new AI draft?')
    ) {
      return
    }
    setBusy('generate')
    try {
      const callable = httpsCallable(functions, 'generateCoverLetter')
      await callable({ applicationId })
      await onRefresh()
      toast('Cover letter draft generated')
    } catch (error) {
      toast('Unable to generate a cover letter', {
        description: aiErrorMessage(error, 'Please try again.'),
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <WandSparkles className="size-4 text-primary" />
                Cover letter
              </CardTitle>
              <CardDescription>
                Generate a role-specific draft, then edit and approve the version you want to
                use.
              </CardDescription>
            </div>
            <PreparationStatusBadge status={coverLetter.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Your cover letter will appear here. Generate a draft or write one yourself."
            className="min-h-[360px] resize-y font-normal leading-relaxed"
            disabled={readOnly}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {wordCount(body)} words
              {dirty && !readOnly ? ' · unsaved changes' : ''}
            </span>
            {coverLetter.aiProvider && (
              <span>
                AI draft · {coverLetter.aiProvider}
                {coverLetter.model ? ` / ${coverLetter.model}` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <>
                <Button
                  size="sm"
                  onClick={() => void generate()}
                  disabled={busy !== null}
                >
                  <Sparkles />
                  {body.trim() ? 'Regenerate' : 'Generate cover letter'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void save()}
                  disabled={busy !== null || !body.trim()}
                >
                  {busy === 'save' ? 'Saving…' : 'Save draft'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void approve()}
                  disabled={busy !== null || !canApprove}
                >
                  {busy === 'approve' ? 'Approving…' : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBody(coverLetter.draftBody)}
                  disabled={busy !== null || !coverLetter.draftBody || body === coverLetter.draftBody}
                >
                  <RotateCcw />
                  Restore AI draft
                </Button>
              </>
            )}
          </div>
          {readOnly && (
            <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              This application is beyond the preparation stage. The approved cover letter is
              read-only.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
