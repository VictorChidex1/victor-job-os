import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  label?: string
  rows?: number
}

export function LoadingState({ label = 'Loading…', rows = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}