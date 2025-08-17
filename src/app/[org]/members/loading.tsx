import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingMembers() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="rounded-md border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
