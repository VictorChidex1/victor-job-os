import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useJobSources } from '@/hooks/useJobSources'
import type { JobSourceId } from '@/types/settings'

const sourceSchema = z.object({
  source: z.enum(['greenhouse', 'lever', 'ashby']),
  enabled: z.boolean(),
  searchTerms: z.array(z.string()),
  boardTargets: z.array(z.string()),
})

type SourceFormValues = z.infer<typeof sourceSchema>

const defaultValues: SourceFormValues = {
  source: 'greenhouse',
  enabled: true,
  searchTerms: [],
  boardTargets: [],
}

function CommaField({
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value.join(', ')}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean),
          )
        }
      />
    </div>
  )
}

const sourceLabels: Record<JobSourceId, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  workday: 'Workday',
  custom: 'Custom',
}

export function SourcesTab() {
  const { sources, loading, error, create, update, remove } = useJobSources()
  const form = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues,
  })

  async function handleCreate(values: SourceFormValues) {
    await create(values)
    toast('Source added')
    form.reset(defaultValues)
  }

  if (loading) {
    return <LoadingState label="Loading sources…" rows={3} />
  }

  if (error) {
    return <EmptyState title="Something went wrong" description={error} />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="text-sm font-medium">Add job source</div>
          <form onSubmit={form.handleSubmit(handleCreate)} className="flex flex-col gap-4">
            <Controller
              name="source"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Source</Label>
                  <Select value={field.value} onValueChange={(value) => field.onChange(value as JobSourceId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greenhouse">Greenhouse</SelectItem>
                      <SelectItem value="lever">Lever</SelectItem>
                      <SelectItem value="ashby">Ashby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="boardTargets"
              control={form.control}
              render={({ field }) => (
                <CommaField
                  label="Board targets"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="vercel, netflix"
                />
              )}
            />
            <Controller
              name="searchTerms"
              control={form.control}
              render={({ field }) => (
                <CommaField
                  label="Search terms"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="react, typescript, full-stack"
                />
              )}
            />
            <div>
              <Button type="submit" size="sm">
                <Plus />
                Add source
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sources.length === 0 ? (
        <EmptyState
          title="No job sources yet"
          description="Add a source to start discovering opportunities."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((source) => (
            <Card key={source.id}>
              <CardContent className="flex flex-col gap-4 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{sourceLabels[source.source]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {source.boardTargets?.join(', ') || 'No boards'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={(checked) => void update(source.id, { enabled: checked })}
                      aria-label={`Toggle ${source.source}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${source.source}`}
                      onClick={() => {
                        void remove(source.id)
                        toast('Source removed')
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Search terms</Label>
                  <Input
                    defaultValue={source.searchTerms.join(', ')}
                    onBlur={(event) => {
                      const next = event.target.value
                        .split(',')
                        .map((part) => part.trim())
                        .filter(Boolean)
                      if (JSON.stringify(next) !== JSON.stringify(source.searchTerms)) {
                        void update(source.id, { searchTerms: next })
                      }
                    }}
                    aria-label={`${source.source} search terms`}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="size-3" />
                  {source.lastRunAt
                    ? `Last run ${new Date(source.lastRunAt).toLocaleString()}`
                    : 'Not run yet'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}