import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

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
  const stageColors: Record<string, { bg: string; text: string; border: string }> = {
    'Cutting': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Assembly': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Testing': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Finished': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  }

  const colors = stageColors[stageName] || stageColors['Cutting']

  return (
    <Card className={`p-6 border-2 ${colors.border} ${colors.bg} flex-1`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${colors.text}`}>{stageName}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {activeJobs === 0 ? 'No active jobs' : `${activeJobs} job${activeJobs !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/60 rounded-lg">
          {rejectRate > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">{rejectRate}%</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-green-600">0%</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Active Jobs
          </p>
          <p className={`text-3xl font-bold ${colors.text}`}>{activeJobs}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Rejected
          </p>
          <p className="text-3xl font-bold text-red-600">{rejectedJobs}</p>
        </div>
      </div>
    </Card>
  )
}
