import { Link } from 'react-router'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatApplicationDate,
  isApplicationOverdue,
} from '@/lib/applicationPipeline'
import { SOURCE_LABELS } from '@/lib/job-sources'
import type { Application } from '@/types/applications'

interface ApplicationTableProps {
  applications: Application[]
  applicationHref: (id: string) => string
}

export function ApplicationTable({
  applications,
  applicationHref,
}: ApplicationTableProps) {
  const now = new Date()

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role / company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Next action</TableHead>
            <TableHead className="hidden sm:table-cell">Updated</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const overdue = isApplicationOverdue(application.nextActionAt, now)
            return (
              <TableRow key={application.id}>
                <TableCell className="whitespace-normal py-3">
                  <Link
                    to={applicationHref(application.id)}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {application.jobTitle}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {application.companyName || 'Unknown company'}
                  </div>
                </TableCell>
                <TableCell>
                  <ApplicationStatusBadge
                    status={application.status}
                    outcome={application.outcome}
                  />
                </TableCell>
                <TableCell className="hidden whitespace-normal md:table-cell">
                  {application.nextAction ? (
                    <>
                      <div className={overdue ? 'text-xs text-destructive' : 'text-xs text-foreground'}>
                        {application.nextAction}
                      </div>
                      {application.nextActionAt && (
                        <div
                          className={
                            overdue
                              ? 'text-[10px] text-destructive'
                              : 'text-[10px] text-muted-foreground'
                          }
                        >
                          Due {formatApplicationDate(application.nextActionAt)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {formatApplicationDate(application.updatedAt)}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {SOURCE_LABELS[application.jobSource] ?? application.jobSource}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
