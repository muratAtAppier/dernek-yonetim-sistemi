import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingBoardDetail() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
