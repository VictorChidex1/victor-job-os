import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'

export function DashboardPage() {
  return (
    <PageContainer
      title="Good morning, Victor"
      description="Here's what needs your attention today."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'New opportunities', value: '0' },
          { label: 'Qualified', value: '0' },
          { label: 'Awaiting review', value: '0' },
          { label: 'Follow-ups due', value: '0' },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today&apos;s priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Your pipeline is ready"
              description="Qualified opportunities and outreach drafts will appear here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outreach queue</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No drafts awaiting review"
              description="Outreach drafts that need your attention will appear here."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Welcome to your Job OS"
            description="Your discovery pipeline will surface relevant opportunities here once it's configured."
          />
        </CardContent>
      </Card>
    </PageContainer>
  )
}