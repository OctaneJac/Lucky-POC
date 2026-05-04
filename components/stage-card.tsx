import { AlertCircle } from 'lucide-react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StageCardProps {
  stageName: string
  activeJobs: number
  rejectedJobs: number
  rejectRate: number
}

export function StageCard({
  stageName,
  activeJobs,
  rejectedJobs,
  rejectRate,
}: StageCardProps) {
  return (
    <Card className="min-w-[240px] flex-1">
      <CardHeader>
        <CardTitle className='text-xl'>{stageName}</CardTitle>
        <CardDescription>
          {activeJobs === 0
            ? 'No active jobs'
            : `${activeJobs} job${activeJobs !== 1 ? 's' : ''}`}
        </CardDescription>
        <CardAction>
          {rejectRate > 0 ? (
            <span className="flex items-center gap-1 text-sm font-medium text-destructive">
              <AlertCircle className="size-4" />
              {rejectRate}%
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              0%
            </span>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Active Jobs
            </p>
            <p className="text-3xl font-bold tabular-nums">{activeJobs}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Rejected
            </p>
            <p className="text-3xl font-bold tabular-nums text-destructive">
              {rejectedJobs}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
