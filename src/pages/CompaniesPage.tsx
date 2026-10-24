import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Building2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/layout/PageContainer'
import { PaginationBar } from '@/components/PaginationBar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useCompaniesPage } from '@/hooks/useCompaniesPage'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { CompanyResearchFilter } from '@/services/companies'
import type { Company } from '@/types/companies'

const researchFilters: Array<{ value: CompanyResearchFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'researched', label: 'Researched' },
  { value: 'unresearched', label: 'Not researched' },
]

function formatDate(value?: { toDate?: () => Date }): string {
  const date = value?.toDate?.()
  return date
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'
}

function CompanyCard({ company }: { company: Company }) {
  const jobCount = company.jobCount ?? 0
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-4" />
              </div>
              <h3 className="truncate text-base font-semibold text-foreground">{company.name}</h3>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {company.industry || 'Industry unknown'}
              {company.location ? ` · ${company.location}` : ''}
            </div>
          </div>
          <Badge variant={company.researched ? 'secondary' : 'outline'} className="shrink-0">
            {company.researched ? 'Researched' : 'Not researched'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {jobCount} {jobCount === 1 ? 'opportunity' : 'opportunities'}
          </span>
          <span>Last activity {formatDate(company.updatedAt ?? company.lastSeenAt)}</span>
        </div>

        <div className="flex justify-end">
          <Link
            to={`/app/companies/${company.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View company
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function CompaniesPage() {
  usePageMeta({
    title: 'Companies — Victor Job OS',
    description: 'Research companies and manage contacts and outreach.',
    noindex: true,
    path: '/app/companies',
  })

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [research, setResearch] = useState<CompanyResearchFilter>('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const {
    companies,
    loading,
    error,
    page,
    totalPages,
    total,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
  } = useCompaniesPage({ search: debouncedSearch, research })

  return (
    <PageContainer
      title="Companies"
      description="Research companies and manage contacts and outreach."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search companies or industries…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {researchFilters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={research === filter.value ? 'default' : 'outline'}
              onClick={() => setResearch(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading companies…" rows={5} />
      ) : error ? (
        <EmptyState title="Something went wrong" description={error} />
      ) : companies.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No companies found' : 'No companies yet'}
          description={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Run discovery from the dashboard; companies are created automatically from discovered jobs.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="companies"
            loading={loading}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={() => void prevPage()}
            onNext={() => void nextPage()}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="companies"
            loading={loading}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={() => void prevPage()}
            onNext={() => void nextPage()}
          />
        </div>
      )}
    </PageContainer>
  )
}
