import { Bot, ExternalLink, ListChecks, ShieldQuestion } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  completenessLabel,
  requirementLabel,
} from '@/lib/atsApplicationMetadata'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { AtsApplicationMetadata } from '@/types/jobs'

export function AtsApplicationMetadataCard({
  metadata,
  className,
  onInspect,
  inspectBusy = false,
}: {
  metadata?: AtsApplicationMetadata
  className?: string
  onInspect?: () => void | Promise<void>
  inspectBusy?: boolean
}) {
  if (!metadata) return null

  const source =
    SOURCE_LABELS[metadata.source as keyof typeof SOURCE_LABELS] ??
    metadata.source

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="size-4 text-primary" />
            ATS application metadata
          </CardTitle>
          <Badge variant={metadata.completeness === 'complete' ? 'secondary' : 'outline'}>
            {completenessLabel(metadata.completeness)}
          </Badge>
        </div>
        <CardDescription>
          Captured from the source listing. Unknown fields are not guessed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetaBlock label="Source" value={source} />
          <MetaBlock
            label="Source job ID"
            value={metadata.sourceJobId || 'Not recorded'}
          />
          <MetaBlock
            label="Resume"
            value={requirementLabel(metadata.requiresResume)}
          />
          <MetaBlock
            label="Cover letter"
            value={requirementLabel(metadata.requiresCoverLetter)}
          />
        </div>

        {metadata.applicationUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={
                <a href={metadata.applicationUrl} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink />
              Open application
            </Button>
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {metadata.applicationUrl}
            </span>
            {onInspect && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void onInspect()}
                disabled={inspectBusy}
              >
                <Bot />
                {inspectBusy ? 'Starting…' : 'Inspect application form'}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No application URL was exposed by this source.
          </p>
        )}

        {metadata.questions && metadata.questions.length > 0 ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldQuestion className="size-3.5" />
              Known questions
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {metadata.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Screening questions were not exposed by this source.
          </p>
        )}

        {metadata.formFields && metadata.formFields.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Known fields
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {metadata.formFields.map((field) => (
                <Badge key={field.name} variant="outline" className="font-normal">
                  {field.name}
                  {field.required ? ' · required' : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Full field and question discovery will be added by the browser-automation
          workflow.
        </p>
      </CardContent>
    </Card>
  )
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">{value}</div>
    </div>
  )
}
