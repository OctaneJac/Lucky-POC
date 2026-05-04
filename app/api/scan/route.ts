import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

interface ScanRequest {
  jobId: string
}

interface ScanResponse {
  success: boolean
  message: string
  jobNumber?: string
  currentStage?: number
  stageName?: string
  jobLog?: {
    log_id: number
    jcard_id: string
    current_stage_id: number
    check_in: string
    check_out: string | null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ScanResponse>> {
  try {
    const body: ScanRequest = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get the job card and current stage info
    const jobCards = await sql`
      SELECT j.job_id, jc.jcard_id, jc.jcard_no, j.current_stage_id, s.stage_name, s.stage_id
      FROM j_cards jc
      JOIN jobs j ON jc.jcard_id = j.jcard_id
      LEFT JOIN stages s ON j.current_stage_id = s.stage_id
      WHERE jc.jcard_id = ${parseInt(jobId)}
      LIMIT 1
    `

    if (jobCards.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Job card not found' },
        { status: 404 }
      )
    }

    const jobCard = jobCards[0]
    const jobIdFromJob = jobCard.job_id
    const currentStageId = jobCard.current_stage_id
    const jobNumber = jobCard.jcard_no
    const stageName = jobCard.stage_name
    const nextStageId = currentStageId === 4 ? 4 : currentStageId + 1

    // Get the latest job log entry for this job
    const logs = await sql`
      SELECT id, stage_id, check_in_time, check_out_time
      FROM job_logs
      WHERE job_id = ${jobIdFromJob}
      ORDER BY id DESC
      LIMIT 1
    `

    let jobLog

    if (logs.length === 0) {
      // No logs exist - create first entry with check-in for stage 1
      const now = new Date().toISOString()
      const newLogs = await sql`
        INSERT INTO job_logs (job_id, stage_id, check_in_time, check_out_time)
        VALUES (${jobIdFromJob}, 1, ${now}, NULL)
        RETURNING id, job_id, stage_id, check_in_time, check_out_time
      `
      jobLog = newLogs[0]

      return NextResponse.json({
        success: true,
        message: `Job ${jobNumber} checked into Stage 1 (Start)`,
        jobNumber,
        currentStage: 1,
        stageName: 'Start',
        jobLog: {
          log_id: jobLog.id,
          jcard_id: jobCard.jcard_id,
          current_stage_id: jobLog.stage_id,
          check_in: jobLog.check_in_time,
          check_out: jobLog.check_out_time,
        },
      })
    }

    const latestLog = logs[0]

    // Check if latest log has a checkout time
    if (latestLog.check_out_time === null) {
      // Add checkout time to current entry
      const now = new Date().toISOString()
      const updatedLogs = await sql`
        UPDATE job_logs
        SET check_out_time = ${now}
        WHERE id = ${latestLog.id}
        RETURNING id, job_id, stage_id, check_in_time, check_out_time
      `
      jobLog = updatedLogs[0]

      return NextResponse.json({
        success: true,
        message: `Job ${jobNumber} checked out of Stage ${latestLog.stage_id}`,
        jobNumber,
        currentStage: latestLog.stage_id,
        stageName,
        jobLog: {
          log_id: jobLog.id,
          jcard_id: jobCard.jcard_id,
          current_stage_id: jobLog.stage_id,
          check_in: jobLog.check_in_time,
          check_out: jobLog.check_out_time,
        },
      })
    }

    // Latest log has both check-in and check-out, move to next stage
    const latestStageId = latestLog.stage_id
    const nextStageMoveId = latestStageId === 4 ? 4 : latestStageId + 1
    
    if (latestStageId === 4) {
      return NextResponse.json({
        success: false,
        message: `Job ${jobNumber} is already in the Finished stage`,
        jobNumber,
        currentStage: latestStageId,
        stageName,
      })
    }

    // Create new log entry for next stage
    const now = new Date().toISOString()
    const newLogs = await sql`
      INSERT INTO job_logs (job_id, stage_id, check_in_time, check_out_time)
      VALUES (${jobIdFromJob}, ${nextStageMoveId}, ${now}, NULL)
      RETURNING id, job_id, stage_id, check_in_time, check_out_time
    `
    jobLog = newLogs[0]

    // Update the current stage in the jobs table
    await sql`
      UPDATE jobs
      SET current_stage_id = ${nextStageMoveId}
      WHERE job_id = ${jobIdFromJob}
    `

    // Get the new stage name
    const stages = await sql`
      SELECT stage_name FROM stages WHERE stage_id = ${nextStageMoveId}
    `
    const newStageName = stages[0].stage_name

    return NextResponse.json({
      success: true,
      message: `Job ${jobNumber} moved to Stage ${nextStageMoveId} (${newStageName})`,
      jobNumber,
      currentStage: nextStageMoveId,
      stageName: newStageName,
      jobLog: {
        log_id: jobLog.id,
        jcard_id: jobCard.jcard_id,
        current_stage_id: jobLog.stage_id,
        check_in: jobLog.check_in_time,
        check_out: jobLog.check_out_time,
      },
    })
  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
