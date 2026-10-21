import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import { RefreshCw, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useOutreach } from '@/hooks/useOutreach'
import { usePageMeta } from '@/hooks/usePageMeta'
import { functions } from '@/services/functions'
import type { Outreach } from '@/types/outreach'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  'needs-review': 'Needs review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  sent: 'Sent',
  replied: 'Replied',
  'follow-up-due': 'Follow-up due',
  closed: 'Closed',
}

const statusOrder = [
  'all',
  'needs-review',
  'approved',
  'scheduled',
  'sent',
  'replied',
  'follow-up-due',
  'closed',
]

function statusVariant(status: string): 'secondary' | 'outline' {
  return status === 'replied' || status === 'approved' ? 'secondary' : 'outline'
}

function formatDate(value: Outreach['updatedAt'] | undefined): string {
  const date = value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
}

export function OutreachPage() {
  usePageMeta({
    title: 'Outreach — Victor Job OS',
    description: 'Review, approve, and track your personalized outreach.',
    noindex: true,
    path: '/app/outreach',
  })

  const { items, loading, error, refresh } = useOutreach()
  const [filter, setFilter] = useState('all')
  const [checking, setChecking] = useState(false)

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: items.length }
    for (const item of items) {
      result[item.status] = (result[item.status] ?? 0) + 1
    }
    return result
  }, [items])

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [items, filter],
  )

  async function runFollowUps() {
    setChecking(true)
    try {
      const callable = httpsCallable(functions, 'runFollowUpsNow')
      const response = await callable({})
      const data = response.data as { flagged?: number }
      toast(`Follow-ups checked${data.flagged ? ` — ${data.flagged} now due` : ''}`)
      await refresh()
    } catch {
      toast('Unable to run follow-ups', { description: 'Cloud Functions are not available yet.' })
    } finally {
      setChecking(false)
    }
  }

  return (
    <PageContainer
      title="Outreach"
      description="Draft, approve, send, and track personalized outreach."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => void runFollowUps()} disabled={checking}>
            <Send />
            {checking ? 'Checking…' : 'Check follow-ups'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1">
        {statusOrder.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusLabels[status]}
            <span className="ml-1 text-[0.65rem] opacity-70">{counts[status] ?? 0}</span>
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading outreach…" rows={5} />
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'No outreach yet' : 'Nothing in this stage'}
          description={
            items.length === 0
              ? 'Open a qualified opportunity and choose “Draft outreach” to generate your first message.'
              : 'Try a different stage filter.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-muted-foreground">
                      {item.companyName || 'Unknown company'}
                    </div>
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {item.jobTitle || 'Outreach'}
                    </h3>
                    {item.contactName && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        To: {item.contactName}
                        {item.contactEmail ? ` · ${item.contactEmail}` : ''}
                      </div>
                    )}
                  </div>
                  <Badge variant={statusVariant(item.status)} className="shrink-0">
                    {statusLabels[item.status] ?? item.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{formatDate(item.updatedAt)}</span>
                  <Link
                    to={`/app/outreach/${item.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Open
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
