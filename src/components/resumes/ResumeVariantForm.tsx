import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatCommaList, parseCommaList } from '@/lib/resumeVariants'
import type { ResumeVariant, ResumeVariantInput } from '@/types/resumeVariants'

export function ResumeVariantForm({
  open,
  onOpenChange,
  variant,
  defaultResumeUrl,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: ResumeVariant | null
  defaultResumeUrl?: string
  onSubmit: (input: ResumeVariantInput) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [targetRoles, setTargetRoles] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [notes, setNotes] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setName(variant?.name ?? '')
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setResumeUrl(variant?.resumeUrl ?? defaultResumeUrl ?? '')
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setTargetRoles(variant ? formatCommaList(variant.targetRoles) : '')
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setTechnologies(variant ? formatCommaList(variant.technologies) : '')
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setNotes(variant?.notes ?? '')
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setIsDefault(variant?.isDefault ?? false)
    // oxlint-disable-next-line react/set-state-in-effect -- reset form when the sheet opens
    setError(null)
  }, [open, variant, defaultResumeUrl])

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        name,
        resumeUrl,
        targetRoles: parseCommaList(targetRoles),
        technologies: parseCommaList(technologies),
        notes,
        isDefault,
      })
      onOpenChange(false)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to save the resume variant.'
      setError(message)
      toast('Unable to save resume variant', { description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>{variant ? 'Edit resume variant' : 'Add resume variant'}</SheetTitle>
          <SheetDescription>
            A named link to a resume version, with the roles and technologies it supports.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variant-name">Variant name</Label>
            <Input
              id="variant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Full Stack"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variant-url">Resume URL</Label>
            <Input
              id="variant-url"
              value={resumeUrl}
              onChange={(event) => setResumeUrl(event.target.value)}
              placeholder="https://example.com/resume.pdf"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              Paste a PDF or document link. Values without a protocol get https://.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variant-roles">Target roles</Label>
            <Input
              id="variant-roles"
              value={targetRoles}
              onChange={(event) => setTargetRoles(event.target.value)}
              placeholder="Full Stack Engineer, Software Engineer"
            />
            <p className="text-xs text-muted-foreground">Comma-separated.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variant-tech">Technologies</Label>
            <Input
              id="variant-tech"
              value={technologies}
              onChange={(event) => setTechnologies(event.target.value)}
              placeholder="React, TypeScript, Node.js"
            />
            <p className="text-xs text-muted-foreground">Comma-separated.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="variant-notes">Notes</Label>
            <Textarea
              id="variant-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What this variant emphasizes, and when to use it."
              className="min-h-24"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
            <div>
              <Label htmlFor="variant-default">Default variant</Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Suggested when preparing an application. It is never attached automatically.
              </p>
            </div>
            <Switch
              id="variant-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <SheetFooter className="mt-auto pt-4">
            <SheetClose
              render={<Button type="button" variant="ghost" />}
            >
              Cancel
            </SheetClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : variant ? 'Save variant' : 'Add variant'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
