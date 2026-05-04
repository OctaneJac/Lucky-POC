import { neon } from '@neondatabase/serverless'
import { JobCard } from '@/components/job-card'

interface JCard {
  jcard_id: number
  jcard_no: number
  type: string
  color: string
  gauge: number
  wire_code: string
  wire_tech: string
  length: number
  cir_a: string
  loc_a: number
  slot_a: number
  terminal_a: string
  strip_a: number
  acce_a: string | null
  cir_b: string
  loc_b: number
  slot_b: number
  terminal_b: string
  strip_b: number
  acce_b: string | null
  sub_assy_no: string | null
  part_number: string | null
  h_assy_no: string | null
  model: string | null
  area: string | null
}

interface Job {
  job_id: number
  jcard_id: number
  status: string
  current_stage_id: number | null
  is_flagged: boolean
  created_at: string
  updated_at: string
}

interface Stage {
  stage_id: number
  stage_name: string
}

/** Row passed to `<JobCard />` — j-card fields plus linked job + stage label */
type JobCardRow = JCard & {
  job: {
    job_id: number
    status: string
    current_stage_id: number | null
    is_flagged: boolean
  } | null
  stageName: string | null
}

async function getJobCards(): Promise<JobCardRow[]> {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const jcards = (await sql`SELECT * FROM j_cards`) as JCard[]
    const jobs = (await sql`SELECT * FROM jobs`) as Job[]
    const stages = (await sql`SELECT * FROM stages`) as Stage[]

    const jobMap = new Map<number, Job>()
    jobs.forEach((job) => {
      jobMap.set(job.jcard_id, job)
    })

    const stageMap = new Map<number, string>()
    stages.forEach((stage) => {
      stageMap.set(stage.stage_id, stage.stage_name)
    })

    return jcards.map((jcard): JobCardRow => {
      const job = jobMap.get(jcard.jcard_id) ?? null
      const stageName =
        job?.current_stage_id != null
          ? (stageMap.get(job.current_stage_id) ?? null)
          : null

      return {
        ...jcard,
        job: job
          ? {
              job_id: job.job_id,
              status: job.status,
              current_stage_id: job.current_stage_id,
              is_flagged: job.is_flagged,
            }
          : null,
        stageName,
      }
    })
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}

export default async function JobCardsPage() {
  const jobCards = await getJobCards()

  return (
    <div className="h-full bg-background p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Job cards</h1>
        <p className="text-muted-foreground">Active jobs on the factory floor</p>
      </div>

      {jobCards.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No job cards found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {jobCards.map((jobCard) => (
            <JobCard key={jobCard.jcard_id} jobCard={jobCard} />
          ))}
        </div>
      )}
    </div>
  )
}
