'use client'

import { useMemo } from 'react'
import dashboardData from '@/data/dashboard.json'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StageCard } from '@/components/stage-card'
import { Activity, CheckCircle2, Clock, Target } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export default function DashboardPage() {
  const data = dashboardData

  // Memoize stage colors for charts
  const stageColors = useMemo(
    () => ({
      'Cutting': '#3b82f6',
      'Assembly': '#f59e0b',
      'Testing': '#a855f7',
      'Finished': '#10b981',
    }),
    []
  )

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time factory floor analytics and performance</p>
      </div>

      {/* Scorecards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Jobs */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
              <p className="text-4xl font-bold text-foreground mt-2">{data.scorecards.activeJobs}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Completed Today */}
        <Card className="p-6 border border-border bg-card">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-4xl font-bold text-foreground mt-2">
                  {data.scorecards.completedToday.count}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily Goal: {data.scorecards.completedToday.dailyGoal}</span>
                <span className="font-semibold text-foreground">
                  {data.scorecards.completedToday.percentage}%
                </span>
              </div>
              <Progress
                value={data.scorecards.completedToday.percentage}
                className="h-2"
              />
            </div>
          </div>
        </Card>

        {/* Average Stage Time */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Stage Time</p>
              <p className="text-4xl font-bold text-foreground mt-2">
                {data.scorecards.averageStageTime}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        {/* Average Idle Time */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Idle Time</p>
              <p className="text-4xl font-bold text-foreground mt-2">
                {data.scorecards.averageIdleTime}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stage Cards Row */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Jobs by Stage</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {data.stageData.map(stage => (
            <StageCard
              key={stage.stageId}
              stageName={stage.stageName}
              activeJobs={stage.activeJobs}
              rejectedJobs={stage.rejectedJobs}
              rejectRate={stage.rejectRate}
            />
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units Made Per Hour */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold text-foreground mb-6">Units Made Per Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.unitsPerHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="units"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Working vs Waiting Time */}
        <Card className="p-6 border border-border bg-card">
          <h3 className="text-xl font-semibold text-foreground mb-6">Working vs Waiting Time by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.stageTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stage" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="working" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="waiting" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
