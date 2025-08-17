import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingBoards() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="rounded-md border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div className="space-y-1">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
