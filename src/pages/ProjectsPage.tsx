import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { useProjects } from '@/hooks/useProjects'
import type { PortfolioProject } from '@/types/projects'

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  technologies: z.array(z.string()),
  problem: z.string(),
  solution: z.string(),
  outcomes: z.array(z.string()),
  verifiedMetrics: z.array(z.string()),
  url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
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

function ProjectDialog({
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
              technologies: project.technologies,
              problem: project.problem,
              solution: project.solution,
              outcomes: project.outcomes,
              verifiedMetrics: project.verifiedMetrics,
              url: project.url ?? '',
              relevanceTags: project.relevanceTags,
              isActive: project.isActive,
            }
          : defaultValues,
      )
    }
  }, [open, project, form])

  async function handleSubmit(values: ProjectFormValues) {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'Add project'}</DialogTitle>
          <DialogDescription>
            Projects are the evidence layer behind outreach and applications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <Controller
            name="title"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-title">Title</Label>
                <Input id="project-title" {...field} aria-invalid={!!form.formState.errors.title} />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
            )}
          />
          <Controller
            name="summary"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-summary">Summary</Label>
                <Textarea id="project-summary" rows={3} {...field} />
              </div>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="technologies"
              control={form.control}
              render={({ field }) => (
                <CommaListField
                  label="Technologies"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="React, Firebase, Node.js"
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
                />
              )}
            />
          </div>
          <Controller
            name="problem"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-problem">Problem</Label>
                <Textarea id="project-problem" rows={2} {...field} />
              </div>
            )}
          />
          <Controller
            name="solution"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-solution">Solution</Label>
                <Textarea id="project-solution" rows={2} {...field} />
              </div>
            )}
          />
          <Controller
            name="outcomes"
            control={form.control}
            render={({ field }) => (
              <CommaListField
                label="Outcomes"
                value={field.value}
                onChange={field.onChange}
                placeholder="Outcome one, outcome two"
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
                placeholder="Only metrics you can verify"
              />
            )}
          />
          <Controller
            name="url"
            control={form.control}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-url">URL</Label>
                <Input id="project-url" {...field} placeholder="https://…" />
              </div>
            )}
          />
          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="project-active">Active</Label>
                <Switch id="project-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit">Save project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectsPage() {
  const { projects, loading, error, create, update, remove } = useProjects()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioProject | null>(null)

  const columns: DataTableColumn<PortfolioProject>[] = [
    {
      header: 'Project',
      accessorKey: 'title',
      cell: (project) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{project.title}</span>
          <span className="text-xs text-muted-foreground">{project.summary}</span>
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
              setDialogOpen(true)
            }}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.title}`}
            onClick={() => {
              void remove(project.id)
              toast('Project deleted')
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  async function handleCreate(values: ProjectFormValues) {
    await create(values)
    toast('Project created')
  }

  async function handleUpdate(values: ProjectFormValues) {
    if (editing) {
      await update(editing.id, values)
      toast('Project updated')
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
            setDialogOpen(true)
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
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </PageContainer>
  )
}