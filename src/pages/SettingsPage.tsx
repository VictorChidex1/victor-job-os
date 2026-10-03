import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { SourcesTab } from '@/components/settings/SourcesTab'
import { useSettings } from '@/hooks/useSettings'

const opportunitySchema = z.object({
  preferredRoles: z.array(z.string()),
  preferredTechnologies: z.array(z.string()),
  preferredLocations: z.array(z.string()),
  remotePreference: z.boolean(),
  minFitScore: z.number().min(0).max(100),
  employmentTypes: z.array(z.string()),
  excludedRoles: z.array(z.string()),
  excludedCompanies: z.array(z.string()),
  dailyTarget: z.number().min(1).max(100),
})

const outreachSchema = z.object({
  requireApprovalBeforeSending: z.boolean(),
  maxFollowUps: z.number().min(0).max(10),
  followUpIntervalDays: z.number().min(1).max(60),
})

type OpportunityFormValues = z.infer<typeof opportunitySchema>
type OutreachFormValues = z.infer<typeof outreachSchema>

const defaultOpportunity: OpportunityFormValues = {
  preferredRoles: [],
  preferredTechnologies: [],
  preferredLocations: [],
  remotePreference: true,
  minFitScore: 60,
  employmentTypes: [],
  excludedRoles: [],
  excludedCompanies: [],
  dailyTarget: 20,
}

const defaultOutreach: OutreachFormValues = {
  requireApprovalBeforeSending: true,
  maxFollowUps: 2,
  followUpIntervalDays: 5,
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

export function SettingsPage() {
  const { settings, loading, error, saving, save } = useSettings()

  const opportunityForm = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: defaultOpportunity,
  })
  const outreachForm = useForm<OutreachFormValues>({
    resolver: zodResolver(outreachSchema),
    defaultValues: defaultOutreach,
  })

  useEffect(() => {
    if (settings) {
      opportunityForm.reset({
        preferredRoles: settings.opportunity?.preferredRoles ?? [],
        preferredTechnologies: settings.opportunity?.preferredTechnologies ?? [],
        preferredLocations: settings.opportunity?.preferredLocations ?? [],
        remotePreference: settings.opportunity?.remotePreference ?? true,
        minFitScore: settings.opportunity?.minFitScore ?? 60,
        employmentTypes: settings.opportunity?.employmentTypes ?? [],
        excludedRoles: settings.opportunity?.excludedRoles ?? [],
        excludedCompanies: settings.opportunity?.excludedCompanies ?? [],
        dailyTarget: settings.opportunity?.dailyTarget ?? 20,
      })
      outreachForm.reset({
        requireApprovalBeforeSending: settings.outreach?.requireApprovalBeforeSending ?? true,
        maxFollowUps: settings.outreach?.maxFollowUps ?? 2,
        followUpIntervalDays: settings.outreach?.followUpIntervalDays ?? 5,
      })
    }
  }, [settings, opportunityForm, outreachForm])

  async function saveOpportunity(values: OpportunityFormValues) {
    try {
      await save({ opportunity: values })
      toast('Opportunity settings saved')
    } catch {
      toast('Unable to save', { description: 'Please try again.' })
    }
  }

  async function saveOutreach(values: OutreachFormValues) {
    try {
      await save({ outreach: values })
      toast('Outreach settings saved')
    } catch {
      toast('Unable to save', { description: 'Please try again.' })
    }
  }

  if (loading) {
    return (
      <PageContainer title="Settings">
        <LoadingState label="Loading settings…" rows={4} />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Settings">
        <EmptyState title="Something went wrong" description={error} />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Settings"
      description="Control sources, preferences, automation, and AI."
    >
      <Tabs defaultValue="opportunity">
        <TabsList>
          <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Opportunity preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={opportunityForm.handleSubmit(saveOpportunity)}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="preferredRoles"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Preferred roles"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Senior React Engineer"
                      />
                    )}
                  />
                  <Controller
                    name="preferredTechnologies"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Preferred technologies"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="React, TypeScript, Node.js"
                      />
                    )}
                  />
                  <Controller
                    name="preferredLocations"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Preferred locations"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Remote, Lagos"
                      />
                    )}
                  />
                  <Controller
                    name="employmentTypes"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Employment types"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Full-time, Contract"
                      />
                    )}
                  />
                  <Controller
                    name="excludedRoles"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Excluded roles"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Roles to skip"
                      />
                    )}
                  />
                  <Controller
                    name="excludedCompanies"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <CommaListField
                        label="Excluded companies"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Companies to skip"
                      />
                    )}
                  />
                  <Controller
                    name="minFitScore"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="minFitScore">Minimum fit score (%)</Label>
                        <Input
                          id="minFitScore"
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="dailyTarget"
                    control={opportunityForm.control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="dailyTarget">Daily opportunity target</Label>
                        <Input
                          id="dailyTarget"
                          type="number"
                          min={1}
                          max={100}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </div>
                    )}
                  />
                </div>
                <Controller
                  name="remotePreference"
                  control={opportunityForm.control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="remotePreference">Prefer remote</Label>
                        <p className="text-xs text-muted-foreground">
                          Remote opportunities are prioritized.
                        </p>
                      </div>
                      <Switch
                        id="remotePreference"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                <div>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outreach preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={outreachForm.handleSubmit(saveOutreach)}
                className="flex flex-col gap-4"
              >
                <Controller
                  name="requireApprovalBeforeSending"
                  control={outreachForm.control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="requireApproval">
                          Require approval before sending
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Outreach is never sent without your approval.
                        </p>
                      </div>
                      <Switch
                        id="requireApproval"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="maxFollowUps"
                    control={outreachForm.control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="maxFollowUps">Maximum follow-ups</Label>
                        <Input
                          id="maxFollowUps"
                          type="number"
                          min={0}
                          max={10}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="followUpIntervalDays"
                    control={outreachForm.control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="followUpIntervalDays">Follow-up interval (days)</Label>
                        <Input
                          id="followUpIntervalDays"
                          type="number"
                          min={1}
                          max={60}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </div>
                    )}
                  />
                </div>
                <div>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <SourcesTab />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Coming in a later phase"
                description="AI provider and model settings will be available with the intelligence layer."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Coming in a later phase"
                description="Email configuration will appear with the outreach workflow."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Coming in a later phase"
                description="Scheduled workflows and automation monitoring arrive with the discovery pipeline."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}