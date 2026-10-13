import { useEffect, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { useProjects } from '@/hooks/useProjects'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { PortfolioProject } from '@/types/projects'

const projectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  summary: z.string().trim().min(1, 'Project summary is required'),
  technologies: z.array(z.string()),
  problem: z.string(),
  solution: z.string(),
  outcomes: z.array(z.string()),
  verifiedMetrics: z.array(z.string()),
  url: z.string().refine((val) => {
    if (!val || val.trim() === '') return true
    try {
      const formatted = /^https?:\/\//i.test(val.trim()) ? val.trim() : `https://${val.trim()}`
      const parsed = new URL(formatted)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Enter a valid URL (e.g. https://example.com or example.com)'),
  relevanceTags: z.array(z.string()),
  isActive: z.boolean(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

const defaultValues: ProjectFormValues = {
  title: '',
  summary: '',
  technologies: [],
  problem: '',
  solution: '',
  outcomes: [],
  verifiedMetrics: [],
  url: '',
  relevanceTags: [],
  isActive: true,
}

function CommaListField({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  helperText?: string
}) {
  const [draft, setDraft] = useState('')

  function commitItems(text: string) {
    const raw = text.trim()
    if (!raw) return
    const incoming = raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const newItems = incoming.filter((item) => !value.includes(item))
    if (newItems.length > 0) {
      onChange([...value, ...newItems])
    }
    setDraft('')
  }

  function handleInputChange(text: string) {
    if (text.includes(',')) {
      const parts = text.split(',')
      const toAdd: string[] = []
      let remainder = ''
      for (let i = 0; i < parts.length; i++) {
        const item = parts[i].trim()
        if (i === parts.length - 1 && !text.endsWith(',')) {
          remainder = parts[i]
        } else if (item.length > 0 && !value.includes(item) && !toAdd.includes(item)) {
          toAdd.push(item)
        }
      }
      if (toAdd.length > 0) {
        onChange([...value, ...toAdd])
      }
      setDraft(remainder)
    } else {
      setDraft(text)
    }
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium text-foreground">{label}</Label>
        {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          aria-label={`Add ${label}`}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={() => commitItems(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitItems(draft)
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => commitItems(draft)}
          disabled={!draft.trim()}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((item, index) => (
            <Badge key={`${item}-${index}`} variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remove ${item}`}
                className="rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectSheet({
  open,
  onOpenChange,
  project,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: PortfolioProject | null
  onSubmit: (values: ProjectFormValues) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        project
          ? {
              title: project.title,
              summary: project.summary,
              technologies: project.technologies ?? [],
              problem: project.problem ?? '',
              solution: project.solution ?? '',
              outcomes: project.outcomes ?? [],
              verifiedMetrics: project.verifiedMetrics ?? [],
              url: project.url ?? '',
              relevanceTags: project.relevanceTags ?? [],
              isActive: project.isActive ?? true,
            }
          : defaultValues,
      )
    }
  }, [open, project, form])

  async function handleFormSubmit(values: ProjectFormValues) {
    try {
      setIsSubmitting(true)
      let cleanUrl = values.url?.trim() ?? ''
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`
      }
      await onSubmit({ ...values, url: cleanUrl })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFormInvalid(errors: FieldErrors<ProjectFormValues>) {
    const errorList = Object.values(errors).map((e) => e?.message).filter(Boolean)
    if (errorList.length > 0) {
      toast.error(errorList[0] as string)
    } else {
      toast.error('Please complete all required fields')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl sm:max-w-2xl md:max-w-3xl w-full sm:w-[640px] md:w-[720px] p-0 flex flex-col h-full overflow-hidden bg-background text-foreground border-l shadow-2xl"
      >
        <SheetHeader className="px-6 py-5 border-b bg-muted/20 shrink-0">
          <SheetTitle className="text-xl font-semibold tracking-tight text-foreground">
            {project ? 'Edit project' : 'Add project'}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Verified portfolio proof used as evidence in outreach and job applications.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleFormSubmit, handleFormInvalid)}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Overview & Identification */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overview & Identification
              </h3>
              <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="project-title" className="font-medium">
                      Project Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="project-title"
                      placeholder="e.g. TrendzHauz Media Platform"
                      {...field}
                      aria-invalid={!!form.formState.errors.title}
                    />
                    {form.formState.errors.title && (
                      <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="summary"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="project-summary" className="font-medium">
                      Summary <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="project-summary"
                      rows={3}
                      placeholder="High-level summary of what this project is and its significance..."
                      {...field}
                      aria-invalid={!!form.formState.errors.summary}
                    />
                    {form.formState.errors.summary && (
                      <p className="text-xs text-destructive">{form.formState.errors.summary.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="url"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="project-url" className="font-medium">
                      Live URL or Demo Link
                    </Label>
                    <Input
                      id="project-url"
                      placeholder="https://trendzhauz.com"
                      {...field}
                      aria-invalid={!!form.formState.errors.url}
                    />
                    {form.formState.errors.url && (
                      <p className="text-xs text-destructive">{form.formState.errors.url.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Stack & Categorization */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stack & Categorization
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  name="technologies"
                  control={form.control}
                  render={({ field }) => (
                    <CommaListField
                      label="Technologies"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="React, Firebase, Tailwind"
                      helperText="Type or paste comma-separated"
                    />
                  )}
                />
                <Controller
                  name="relevanceTags"
                  control={form.control}
                  render={({ field }) => (
                    <CommaListField
                      label="Relevance tags"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="full-stack, serverless"
                      helperText="Target match tags"
                    />
                  )}
                />
              </div>
            </div>

            {/* Case Study Proof */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Case Study Proof
              </h3>
              <Controller
                name="problem"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="project-problem" className="font-medium">
                      Problem Statement
                    </Label>
                    <Textarea
                      id="project-problem"
                      rows={3}
                      placeholder="What specific challenge, technical bottleneck, or user problem did you tackle?"
                      {...field}
                    />
                  </div>
                )}
              />

              <Controller
                name="solution"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="project-solution" className="font-medium">
                      Solution & Architecture
                    </Label>
                    <Textarea
                      id="project-solution"
                      rows={4}
                      placeholder="What architecture, tools, and technical patterns did you build to solve it?"
                      {...field}
                    />
                  </div>
                )}
              />
            </div>

            {/* Impact & Verification */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Impact & Verification
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  name="outcomes"
                  control={form.control}
                  render={({ field }) => (
                    <CommaListField
                      label="Outcomes"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Outcome 1, Outcome 2"
                      helperText="Key results achieved"
                    />
                  )}
                />
                <Controller
                  name="verifiedMetrics"
                  control={form.control}
                  render={({ field }) => (
                    <CommaListField
                      label="Verified metrics"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g. 99.9% uptime, <150ms latency"
                      helperText="Empirical facts only"
                    />
                  )}
                />
              </div>
            </div>

            {/* Status Switch */}
            <div className="pt-2 border-t">
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3.5 bg-muted/10">
                    <div className="space-y-0.5">
                      <Label htmlFor="project-active" className="font-medium cursor-pointer">
                        Active Portfolio Project
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Included in evidence matching for applications and outreach.
                      </p>
                    </div>
                    <Switch
                      id="project-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <SheetFooter className="px-6 py-4 border-t bg-card/90 backdrop-blur shrink-0 flex flex-row items-center justify-end gap-3 mt-auto">
            <SheetClose
              render={
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={isSubmitting} className="min-w-28">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : project ? (
                'Save changes'
              ) : (
                'Save project'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function ProjectsPage() {
  usePageMeta({
    title: 'Projects — Victor Job OS',
    description: 'Manage verified portfolio projects used for opportunity matching.',
    noindex: true,
    path: '/app/projects',
  })
  const { projects, loading, error, create, update, remove } = useProjects()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioProject | null>(null)

  const columns: DataTableColumn<PortfolioProject>[] = [
    {
      header: 'Project',
      accessorKey: 'title',
      cell: (project) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{project.title}</span>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors"
                title="Open project URL"
              >
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <span className="text-xs text-muted-foreground line-clamp-2">{project.summary}</span>
        </div>
      ),
    },
    {
      header: 'Technologies',
      cell: (project) => (
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="outline" className="text-[0.65rem]">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 4 && (
            <Badge variant="outline" className="text-[0.65rem] text-muted-foreground">
              +{project.technologies.length - 4}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Verified metrics',
      cell: (project) => (
        <span className="text-sm text-muted-foreground">{project.verifiedMetrics.length}</span>
      ),
    },
    {
      header: 'Status',
      cell: (project) =>
        project.isActive ? (
          <Badge variant="secondary" className="text-[0.65rem]">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-[0.65rem]">Inactive</Badge>
        ),
    },
    {
      header: '',
      cell: (project) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${project.title}`}
            onClick={() => {
              setEditing(project)
              setSheetOpen(true)
            }}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.title}`}
            onClick={async () => {
              try {
                await remove(project.id)
                toast.success('Project deleted')
              } catch {
                toast.error('Failed to delete project')
              }
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  async function handleCreate(values: ProjectFormValues) {
    try {
      await create(values)
      toast.success('Project created successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create project. Please try again.')
      throw err
    }
  }

  async function handleUpdate(values: ProjectFormValues) {
    if (editing) {
      try {
        await update(editing.id, values)
        toast.success('Project updated successfully')
      } catch (err) {
        console.error(err)
        toast.error('Failed to update project. Please try again.')
        throw err
      }
    }
  }

  if (error) {
    return (
      <PageContainer title="Projects">
        <EmptyState title="Something went wrong" description={error} />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Projects"
      description="Verified portfolio proof used in outreach and applications."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setSheetOpen(true)
          }}
        >
          <Plus />
          Add project
        </Button>
      }
    >
      {loading ? (
        <LoadingState label="Loading projects…" rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          emptyTitle="No projects yet"
          emptyDescription="Add verified portfolio projects to use as evidence."
        />
      )}
      <ProjectSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        project={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </PageContainer>
  )
}