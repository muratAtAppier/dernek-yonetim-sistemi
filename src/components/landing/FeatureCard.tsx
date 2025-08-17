import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon size={20} /></div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 text-sm text-muted-foreground">
        {/* Ek açıklama yeri gerekirse */}
      </CardContent>
    </Card>
  )
}
