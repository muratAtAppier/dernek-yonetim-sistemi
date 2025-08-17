import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
