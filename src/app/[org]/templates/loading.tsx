import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingTemplates() {
  return (
    <div>
      <div className="mb-4">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-16" />
      </div>
      <ul className="divide-y rounded-md border bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
