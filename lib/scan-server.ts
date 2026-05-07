import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type PendingAction = 'check_in' | 'check_out' | 'advance' | 'already_finished'

export interface JobCardRow {
  job_id: number
  jcard_id: number
  jcard_no: number
  current_stage_id: number | null
  stage_name: string | null
  stage_id: number | null
}

export interface LogRow {
  id: number
  stage_id: number
  check_in_time: string
  check_out_time: string | null
}

export interface ScanPreviewOk {
  success: true
  jobNumber: number
  jcardId: number
  jobDbId: number
  currentStageId: number | null
  stageName: string | null
  pendingAction: PendingAction
  summary: string
  /** Log row to flag on reject when present */
  rejectTargetLogId: number | null
}

export interface ScanPreviewErr {
  success: false
  message: string
}

export type ScanPreview = ScanPreviewOk | ScanPreviewErr

function parseJcardId(jobId: string): number | null {
  const n = parseInt(jobId.trim(), 10)
  return Number.isFinite(n) ? n : null
}

export async function loadJobByJcardId(jcardId: number): Promise<JobCardRow | null> {
  const rows = await sql`
    SELECT j.job_id, jc.jcard_id, jc.jcard_no, j.current_stage_id, s.stage_name, s.stage_id
    FROM j_cards jc
    JOIN jobs j ON jc.jcard_id = j.jcard_id
    LEFT JOIN stages s ON j.current_stage_id = s.stage_id
    WHERE jc.jcard_id = ${jcardId}
    LIMIT 1
  `
  return rows.length ? (rows[0] as JobCardRow) : null
}

export async function loadLatestLog(jobDbId: number): Promise<LogRow | null> {
  const rows = await sql`
    SELECT id, stage_id, check_in_time, check_out_time
    FROM job_logs
    WHERE job_id = ${jobDbId}
    ORDER BY id DESC
    LIMIT 1
  `
  return rows.length ? (rows[0] as LogRow) : null
}

export async function buildScanPreview(jobIdInput: string): Promise<ScanPreview> {
  const jcardId = parseJcardId(jobIdInput)
  if (jcardId === null) {
    return { success: false, message: 'Invalid job ID' }
  }

  const jobCard = await loadJobByJcardId(jcardId)
  if (!jobCard) {
    return { success: false, message: 'Job card not found' }
  }

  const jobDbId = jobCard.job_id
  const jobNumber = jobCard.jcard_no
  const stageName = jobCard.stage_name

  const latestLog = await loadLatestLog(jobDbId)

  if (!latestLog) {
    return {
      success: true,
      jobNumber,
      jcardId,
      jobDbId,
      currentStageId: jobCard.current_stage_id,
      stageName,
      pendingAction: 'check_in',
      summary: `Check in job #${jobNumber} to Stage 1 (Start)`,
      rejectTargetLogId: null,
    }
  }

  if (latestLog.check_out_time === null) {
    return {
      success: true,
      jobNumber,
      jcardId,
      jobDbId,
      currentStageId: jobCard.current_stage_id,
      stageName,
      pendingAction: 'check_out',
      summary: `Check out job #${jobNumber} from Stage ${latestLog.stage_id}${stageName ? ` (${stageName})` : ''}`,
      rejectTargetLogId: latestLog.id,
    }
  }

  const latestStageId = latestLog.stage_id
  if (latestStageId === 4) {
    return {
      success: true,
      jobNumber,
      jcardId,
      jobDbId,
      currentStageId: jobCard.current_stage_id,
      stageName,
      pendingAction: 'already_finished',
      summary: `Job #${jobNumber} is already in the Finished stage — no move available`,
      rejectTargetLogId: latestLog.id,
    }
  }

  const nextStageMoveId = latestStageId === 4 ? 4 : latestStageId + 1
  const stages = await sql`
    SELECT stage_name FROM stages WHERE stage_id = ${nextStageMoveId}
  `
  const nextName = stages[0]?.stage_name ?? `Stage ${nextStageMoveId}`

  return {
    success: true,
    jobNumber,
    jcardId,
    jobDbId,
    currentStageId: jobCard.current_stage_id,
    stageName,
    pendingAction: 'advance',
    summary: `Move job #${jobNumber} to Stage ${nextStageMoveId} (${nextName})`,
    rejectTargetLogId: latestLog.id,
  }
}

export interface ScanCommitResult {
  success: boolean
  message: string
  jobNumber?: number
  currentStage?: number
  stageName?: string
  jobLog?: {
    log_id: number
    jcard_id: number
    current_stage_id: number
    check_in: string
    check_out: string | null
  }
}

export async function commitScan(jobIdInput: string): Promise<ScanCommitResult> {
  const jcardId = parseJcardId(jobIdInput)
  if (jcardId === null) {
    return { success: false, message: 'Invalid job ID' }
  }

  const jobCards = await sql`
    SELECT j.job_id, jc.jcard_id, jc.jcard_no, j.current_stage_id, s.stage_name, s.stage_id
    FROM j_cards jc
    JOIN jobs j ON jc.jcard_id = j.jcard_id
    LEFT JOIN stages s ON j.current_stage_id = s.stage_id
    WHERE jc.jcard_id = ${jcardId}
    LIMIT 1
  `

  if (jobCards.length === 0) {
    return { success: false, message: 'Job card not found' }
  }

  const jobCard = jobCards[0] as JobCardRow
  const jobIdFromJob = jobCard.job_id
  const stageName = jobCard.stage_name
  const jobNumber = jobCard.jcard_no

  const logs = await sql`
    SELECT id, stage_id, check_in_time, check_out_time
    FROM job_logs
    WHERE job_id = ${jobIdFromJob}
    ORDER BY id DESC
    LIMIT 1
  `

  let jobLog: LogRow

  if (logs.length === 0) {
    const now = new Date().toISOString()
    const newLogs = await sql`
      INSERT INTO job_logs (job_id, stage_id, check_in_time, check_out_time)
      VALUES (${jobIdFromJob}, 1, ${now}, NULL)
      RETURNING id, job_id, stage_id, check_in_time, check_out_time
    `
    jobLog = newLogs[0] as LogRow

    return {
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
    }
  }

  const latestLog = logs[0] as LogRow

  if (latestLog.check_out_time === null) {
    const now = new Date().toISOString()
    const updatedLogs = await sql`
      UPDATE job_logs
      SET check_out_time = ${now}
      WHERE id = ${latestLog.id}
      RETURNING id, job_id, stage_id, check_in_time, check_out_time
    `
    jobLog = updatedLogs[0] as LogRow

    return {
      success: true,
      message: `Job ${jobNumber} checked out of Stage ${latestLog.stage_id}`,
      jobNumber,
      currentStage: latestLog.stage_id,
      stageName: stageName ?? undefined,
      jobLog: {
        log_id: jobLog.id,
        jcard_id: jobCard.jcard_id,
        current_stage_id: jobLog.stage_id,
        check_in: jobLog.check_in_time,
        check_out: jobLog.check_out_time,
      },
    }
  }

  const latestStageId = latestLog.stage_id
  const nextStageMoveId = latestStageId === 4 ? 4 : latestStageId + 1

  if (latestStageId === 4) {
    return {
      success: false,
      message: `Job ${jobNumber} is already in the Finished stage`,
      jobNumber,
      currentStage: latestStageId,
      stageName: stageName ?? undefined,
    }
  }

  const now = new Date().toISOString()
  const newLogs = await sql`
    INSERT INTO job_logs (job_id, stage_id, check_in_time, check_out_time)
    VALUES (${jobIdFromJob}, ${nextStageMoveId}, ${now}, NULL)
    RETURNING id, job_id, stage_id, check_in_time, check_out_time
  `
  jobLog = newLogs[0] as LogRow

  await sql`
    UPDATE jobs
    SET current_stage_id = ${nextStageMoveId}, updated_at = ${now}
    WHERE job_id = ${jobIdFromJob}
  `

  const stages = await sql`
    SELECT stage_name FROM stages WHERE stage_id = ${nextStageMoveId}
  `
  const newStageName = stages[0].stage_name as string

  return {
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
  }
}

export interface RejectResult {
  success: boolean
  message: string
  jobNumber?: number
}

export interface VerificationPayload {
  terminal: string
  wireType: string
  type: string
}

export interface VerifyAndCommitResult extends ScanCommitResult {
  checks?: {
    expected: VerificationPayload
    scanned: VerificationPayload
  }
}

function normalizeScannedValue(value: string): string {
  return value.trim().toLowerCase()
}

export async function verifyAndCommitScan(
  jobIdInput: string,
  scanned: VerificationPayload
): Promise<VerifyAndCommitResult> {
  const jcardId = parseJcardId(jobIdInput)
  if (jcardId === null) {
    return { success: false, message: 'Invalid job ID' }
  }

  const rows = await sql`
    SELECT
      jc.jcard_no,
      jc.terminal_a,
      jc.terminal_b,
      jc.wire_tech,
      jc.type
    FROM j_cards jc
    WHERE jc.jcard_id = ${jcardId}
    LIMIT 1
  `

  if (rows.length === 0) {
    return { success: false, message: 'Job card not found' }
  }

  const jobCard = rows[0] as {
    jcard_no: number
    terminal_a: string
    terminal_b: string
    wire_tech: string
    type: string
  }

  const expected: VerificationPayload = {
    terminal: `${jobCard.terminal_a} | ${jobCard.terminal_b}`,
    wireType: jobCard.wire_tech,
    type: jobCard.type,
  }

  const scannedTerminal = normalizeScannedValue(scanned.terminal)
  const expectedTerminalA = normalizeScannedValue(jobCard.terminal_a)
  const expectedTerminalB = normalizeScannedValue(jobCard.terminal_b)
  const terminalMatches = scannedTerminal === expectedTerminalA || scannedTerminal === expectedTerminalB

  const wireTypeMatches =
    normalizeScannedValue(scanned.wireType) === normalizeScannedValue(jobCard.wire_tech)
  const typeMatches = normalizeScannedValue(scanned.type) === normalizeScannedValue(jobCard.type)

  if (!terminalMatches || !wireTypeMatches || !typeMatches) {
    const mismatchFields = [
      !terminalMatches ? 'Terminal' : null,
      !wireTypeMatches ? 'Wire type' : null,
      !typeMatches ? 'Type' : null,
    ].filter(Boolean)

    return {
      success: false,
      message: `Verification failed. Mismatch in: ${mismatchFields.join(', ')}.`,
      jobNumber: jobCard.jcard_no,
      checks: {
        expected,
        scanned,
      },
    }
  }

  const committed = await commitScan(jobIdInput)
  return {
    ...committed,
    checks: {
      expected,
      scanned,
    },
  }
}

export async function rejectScan(jobIdInput: string, remarks?: string): Promise<RejectResult> {
  const preview = await buildScanPreview(jobIdInput)
  if (!preview.success) {
    return { success: false, message: preview.message }
  }

  const now = new Date().toISOString()
  const jobDbId = preview.jobDbId

  await sql`
    UPDATE jobs
    SET is_flagged = true, updated_at = ${now}
    WHERE job_id = ${jobDbId}
  `

  if (preview.rejectTargetLogId !== null) {
    if (remarks?.trim()) {
      await sql`
        UPDATE job_logs
        SET flagged = true, remarks = ${remarks.trim()}
        WHERE id = ${preview.rejectTargetLogId}
      `
    } else {
      await sql`
        UPDATE job_logs
        SET flagged = true
        WHERE id = ${preview.rejectTargetLogId}
      `
    }
  }

  return {
    success: true,
    message: `Job ${preview.jobNumber} flagged — stage advance cancelled`,
    jobNumber: preview.jobNumber,
  }
}
