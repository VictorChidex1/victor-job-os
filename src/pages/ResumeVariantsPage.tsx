import { useState } from 'react'
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ResumeVariantForm } from '@/components/resumes/ResumeVariantForm'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useProfile } from '@/hooks/useProfile'
import { useResumeVariants } from '@/hooks/useResumeVariants'
import type { ResumeVariant, ResumeVariantInput } from '@/types/resumeVariants'

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''
}

export function ResumeVariantsPage() {
  usePageMeta({
    title: 'Resumes — Victor Job OS',
    description: 'Manage named resume variants and choose the right one for each application.',
    noindex: true,
    path: '/app/resumes',
  })

  const { profile } = useProfile()
  const { variants, loading, error, create, update, setDefault, remove, refresh } =
    useResumeVariants()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ResumeVariant | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(variant: ResumeVariant) {
    setEditing(variant)
    setFormOpen(true)
  }

  async function submit(input: ResumeVariantInput) {
    if (editing) {
      await update(editing.id, input)
      toast('Resume variant updated')
    } else {
      await create(input)
      toast('Resume variant added')
    }
  }

  async function makeDefault(variant: ResumeVariant) {
    setSettingDefault(variant.id)
    try {
      await setDefault(variant.id)
      toast(`${variant.name} is now the default variant`)
    } catch {
      toast('Unable to set the default variant')
    } finally {
      setSettingDefault(null)
    }
  }

  async function deleteVariant(variant: ResumeVariant) {
    if (!window.confirm(`Delete the "${variant.name}" resume variant?`)) {
      return
    }
    try {
      await remove(variant.id)
      toast('Resume variant deleted')
    } catch {
      toast('Unable to delete the resume variant')
    }
  }

  return (
    <PageContainer
      title="Resumes"
      description="Named resume versions for different roles. The default is a suggestion and is never attached automatically."
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus />
          New resume variant
        </Button>
      }
    >
      {loading ? (
        <LoadingState label="Loading resume variants…" rows={4} />
      ) : error ? (
        <EmptyState
          title="Unable to load resume variants"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      ) : variants.length === 0 ? (
        <EmptyState
          title="No resume variants yet"
          description="Create a named resume version for the roles you pursue. Your profile resume remains the fallback."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus />
              Add your first variant
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-4 text-primary" />
                        {variant.name}
                      </CardTitle>
                      {variant.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="size-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {variant.targetRoles.length
                        ? variant.targetRoles.join(' · ')
                        : 'No target roles specified'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <a
                  href={variant.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1 truncate text-sm text-primary underline underline-offset-4"
                >
                  Open resume
                  <ExternalLink className="size-3" />
                </a>

                {variant.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {variant.technologies.map((technology) => (
                      <Badge key={technology} variant="outline" className="font-normal">
                        {technology}
                      </Badge>
                    ))}
                  </div>
                )}

                {variant.notes && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {variant.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {variant.updatedAt && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      Updated {formatDate(variant.updatedAt)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(variant)}>
                    Edit
                  </Button>
                  {!variant.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void makeDefault(variant)}
                      disabled={settingDefault === variant.id}
                    >
                      <Star />
                      {settingDefault === variant.id ? 'Setting…' : 'Make default'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void deleteVariant(variant)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResumeVariantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        variant={editing}
        defaultResumeUrl={profile?.resumeUrl}
        onSubmit={submit}
      />
    </PageContainer>
  )
}
