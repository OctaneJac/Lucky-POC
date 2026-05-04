import { neon } from '@neondatabase/serverless'
import { Card } from '@/components/ui/card'
import { BarChart3, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Stage {
  stage_id: number
  stage_name: string
}

interface Job {
  current_stage_id: number | null
  is_flagged: boolean
}

async function getJobStats() {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const jobs = await sql<Job>`SELECT current_stage_id, is_flagged FROM jobs`
    const stages = await sql<Stage>`SELECT * FROM stages`

    const stageMap = new Map()
    stages.forEach(stage => {
      stageMap.set(stage.stage_id, stage.stage_name)
    })

    const stats = {
      totalJobs: jobs.length,
      jobsByStage: new Map<string, number>(),
      flaggedJobs: 0,
      pendingJobs: 0,
    }

    jobs.forEach(job => {
      if (job.is_flagged) stats.flaggedJobs++
      if (job.current_stage_id === null) stats.pendingJobs++
      
      const stageName = job.current_stage_id ? stageMap.get(job.current_stage_id) : 'Pending'
      stats.jobsByStage.set(
        stageName,
        (stats.jobsByStage.get(stageName) || 0) + 1
      )
    })

    return {
      stats,
      stages: Array.from(stats.jobsByStage.entries()),
    }
  } catch (error) {
    console.error('Database error:', error)
    return {
      stats: {
        totalJobs: 0,
        jobsByStage: new Map(),
        flaggedJobs: 0,
        pendingJobs: 0,
      },
      stages: [],
    }
  }
}

export default async function DashboardPage() {
  const { stats, stages } = await getJobStats()

  return (
    <div className="h-full bg-background p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Factory floor overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalJobs}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-slate-300" />
          </div>
        </Card>

        {/* Pending Jobs */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingJobs}</p>
            </div>
            <Clock className="w-12 h-12 text-amber-200" />
          </div>
        </Card>

        {/* In Progress */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalJobs - stats.pendingJobs - stats.flaggedJobs}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-200" />
          </div>
        </Card>

        {/* Flagged */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Flagged</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.flaggedJobs}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200" />
          </div>
        </Card>
      </div>

      {/* Jobs by Stage */}
      <Card className="p-6 border border-border bg-card">
        <h2 className="text-xl font-semibold text-foreground mb-6">Jobs by Stage</h2>
        <div className="space-y-4">
          {stages.length === 0 ? (
            <p className="text-muted-foreground">No data available</p>
          ) : (
            stages.map(([stageName, count]) => (
              <div key={stageName} className="flex items-center justify-between">
                <span className="font-medium text-foreground">{stageName}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / stats.totalJobs) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
