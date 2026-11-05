import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import {
  Check,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PreparationStatusBadge } from '@/components/applications/preparation/PreparationStatusBadge'
import { aiErrorMessage } from '@/lib/ai-errors'
import {
  createEmptyAnswer,
  DEFAULT_APPLICATION_QUESTIONS,
} from '@/lib/applicationPreparation'
import { functions } from '@/services/functions'
import type {
  ApplicationAnswerDraft,
  ApplicationPreparation,
} from '@/types/applicationPreparation'

function answerSnapshot(answers: ApplicationAnswerDraft[]): string {
  return JSON.stringify(
    answers.map((answer) => ({
      id: answer.id,
      question: answer.question,
      answer: answer.answer,
      status: answer.status,
    })),
  )
}

export function ApplicationAnswersEditor({
  applicationId,
  preparation,
  readOnly,
  onSave,
  onRefresh,
}: {
  applicationId: string
  preparation: ApplicationPreparation
  readOnly: boolean
  onSave: (patch: { answers: ApplicationAnswerDraft[] }) => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const [answers, setAnswers] = useState(preparation.answers)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- sync editor state after preparation refresh
    setAnswers(preparation.answers)
  }, [preparation.answers])

  const dirty = answerSnapshot(answers) !== answerSnapshot(preparation.answers)
  const suggestedQuestions = DEFAULT_APPLICATION_QUESTIONS.filter(
    (question) =>
      !answers.some(
        (answer) => answer.question.trim().toLowerCase() === question.toLowerCase(),
      ),
  )

  function updateAnswer(id: string, patch: Partial<ApplicationAnswerDraft>) {
    setAnswers((current) =>
      current.map((answer) => (answer.id === id ? { ...answer, ...patch } : answer)),
    )
  }

  function addQuestion(question = '') {
    setAnswers((current) => [...current, createEmptyAnswer(question)])
  }

  function normalizeForSave(
    next: ApplicationAnswerDraft[],
    approvedIds?: Set<string>,
  ): ApplicationAnswerDraft[] {
    return next
      .filter((answer) => answer.question.trim() || answer.answer.trim())
      .map((answer) => {
        const previous = preparation.answers.find((item) => item.id === answer.id)
        const changed =
          !previous ||
          previous.question !== answer.question ||
          previous.answer !== answer.answer
        let status = answer.status
        if (changed && status === 'approved' && !approvedIds?.has(answer.id)) {
          status = 'draft'
        }
        if (!answer.answer.trim() && status === 'approved') status = 'empty'
        if (status === 'empty' && answer.answer.trim()) status = 'draft'
        return {
          ...answer,
          question: answer.question.trim(),
          answer: answer.answer.trim(),
          status,
        }
      })
  }

  async function saveAnswers(
    next: ApplicationAnswerDraft[],
    quiet = false,
    approvedIds?: Set<string>,
  ): Promise<boolean> {
    const normalized = normalizeForSave(next, approvedIds)
    if (!quiet) setBusy('save')
    try {
      setAnswers(normalized)
      await onSave({ answers: normalized })
      if (!quiet) toast('Application answers saved')
      return true
    } catch {
      toast('Unable to save application answers')
      return false
    } finally {
      if (!quiet) setBusy(null)
    }
  }

  async function generateAnswers(targets: ApplicationAnswerDraft[]) {
    if (targets.length === 0) {
      toast('Add a question first')
      return
    }
    if (targets.length > 10) {
      toast('Generate at most 10 answers at once')
      return
    }
    const questions = targets
      .map((answer) => ({
        id: answer.id,
        question: answer.question.trim(),
      }))
      .filter((question) => question.question)
    if (questions.length !== targets.length) {
      toast('Every answer needs a question before it can be generated')
      return
    }

    setBusy(targets.length === 1 ? `generate:${targets[0].id}` : 'generate-all')
    try {
      if (dirty) {
        const saved = await saveAnswers(answers, true)
        if (!saved) return
      }
      const callable = httpsCallable(functions, 'generateApplicationAnswers')
      await callable({ applicationId, questions })
      await onRefresh()
      toast(
        targets.length === 1
          ? 'Answer draft generated'
          : `${targets.length} answer drafts generated`,
      )
    } catch (error) {
      toast('Unable to generate answers', {
        description: aiErrorMessage(error, 'Please try again.'),
      })
    } finally {
      setBusy(null)
    }
  }

  async function approveAnswer(answer: ApplicationAnswerDraft) {
    if (!answer.answer.trim()) {
      toast('Write or generate an answer first')
      return
    }
    const saved = await saveAnswers(
      answers.map((item) =>
        item.id === answer.id ? { ...item, status: 'approved' } : item,
      ),
      false,
      new Set([answer.id]),
    )
    if (saved) toast('Answer approved')
  }

  async function deleteAnswer(answer: ApplicationAnswerDraft) {
    if (
      answer.answer.trim() &&
      !window.confirm('Remove this question and answer from the preparation?')
    ) {
      return
    }
    setAnswers((current) => current.filter((item) => item.id !== answer.id))
    await saveAnswers(
      answers.filter((item) => item.id !== answer.id),
      true,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                Application answers
              </CardTitle>
              <CardDescription>
                Add the questions from the application, generate grounded drafts, and approve
                the answers you want to keep.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion()}
                disabled={readOnly || busy !== null || answers.length >= 10}
              >
                <Plus />
                Add question
              </Button>
              <Button
                size="sm"
                onClick={() => void generateAnswers(answers)}
                disabled={readOnly || busy !== null || answers.length === 0}
              >
                <Sparkles />
                {busy === 'generate-all' ? 'Generating…' : 'Generate all'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void saveAnswers(answers)}
                disabled={readOnly || busy !== null || !dirty}
              >
                <Save />
                {busy === 'save' ? 'Saving…' : 'Save answers'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {suggestedQuestions.length > 0 && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Suggested questions
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="xs"
                    onClick={() => addQuestion(question)}
                    disabled={readOnly || busy !== null || answers.length >= 10}
                  >
                    <Plus />
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {answers.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <p className="text-sm font-medium text-foreground">No questions yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add a question from the application or start with one of the suggestions
                above.
              </p>
            </div>
          ) : (
            answers.map((answer, index) => (
              <div key={answer.id} className="rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Answer {index + 1}
                  </div>
                  <PreparationStatusBadge status={answer.status} />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <Label htmlFor={`answer-question-${answer.id}`}>Question</Label>
                  <Input
                    id={`answer-question-${answer.id}`}
                    value={answer.question}
                    onChange={(event) =>
                      updateAnswer(answer.id, { question: event.target.value })
                    }
                    placeholder="e.g. Why are you interested in this role?"
                    disabled={readOnly}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <Label htmlFor={`answer-body-${answer.id}`}>Answer</Label>
                  <Textarea
                    id={`answer-body-${answer.id}`}
                    value={answer.answer}
                    onChange={(event) =>
                      updateAnswer(answer.id, { answer: event.target.value })
                    }
                    placeholder="Your answer will appear here. Generate a draft or write one yourself."
                    className="min-h-32"
                    disabled={readOnly}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!readOnly && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void generateAnswers([answer])}
                        disabled={busy !== null || !answer.question.trim()}
                      >
                        <Sparkles />
                        {busy === `generate:${answer.id}` ? 'Generating…' : 'Generate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void approveAnswer(answer)}
                        disabled={busy !== null || !answer.answer.trim()}
                      >
                        <Check />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateAnswer(answer.id, { answer: answer.draftAnswer })
                        }
                        disabled={busy !== null || !answer.draftAnswer}
                      >
                        <RotateCcw />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void deleteAnswer(answer)}
                        disabled={busy !== null}
                      >
                        <Trash2 />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {readOnly && (
            <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              This application is beyond the preparation stage. Answers are read-only.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
