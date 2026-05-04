'use client'

import dashboardData from '@/data/dashboard.json'
import { StageCard } from '@/components/stage-card'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Activity, CheckCircle2, Clock, Target } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

const lineChartConfig = {
  units: {
    label: 'Units',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const barChartConfig = {
  working: {
    label: 'Working',
    color: 'var(--chart-1)',
  },
  waiting: {
    label: 'Waiting',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const data = dashboardData

  return (
    <div className="space-y-8 p-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time factory floor analytics and performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardAction>
              <Activity className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.scorecards.activeJobs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Today</CardTitle>
            <CardDescription>
              Daily goal: {data.scorecards.completedToday.dailyGoal}
            </CardDescription>
            <CardAction>
              <CheckCircle2 className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold tabular-nums">
              {data.scorecards.completedToday.count}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium text-foreground">
                  {data.scorecards.completedToday.percentage}%
                </span>
              </div>
              <Progress value={data.scorecards.completedToday.percentage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Stage Time</CardTitle>
            <CardAction>
              <Clock className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.scorecards.averageStageTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Idle Time</CardTitle>
            <CardAction>
              <Target className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.scorecards.averageIdleTime}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">
          Jobs by Stage
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {data.stageData.map((stage) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Units Made Per Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={lineChartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <LineChart data={data.unitsPerHour}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  type="monotone"
                  dataKey="units"
                  stroke="var(--color-units)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-units)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working vs Waiting Time by Stage (minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={barChartConfig} 
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart data={data.stageTimeData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="working"
                  fill="var(--color-working)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="waiting"
                  fill="var(--color-waiting)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
