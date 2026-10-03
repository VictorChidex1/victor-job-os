import { useLocation } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'

export function PlaceholderPage() {
  const location = useLocation()
  const label = location.pathname === '/' ? 'Overview' : location.pathname

  return (
    <PageContainer title="Under construction">
      <Badge variant="outline" className="w-fit">
        {label}
      </Badge>
      <EmptyState
        title="This section isn't built yet"
        description="This route will be implemented in a later phase."
      />
    </PageContainer>
  )
}