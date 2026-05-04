import { NextRequest, NextResponse } from 'next/server'
import { commitScan } from '@/lib/scan-server'

interface ScanRequest {
  jobId: string
}

interface ScanResponse {
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

    const result = await commitScan(jobId)

    if (!result.success && result.message.includes('not found')) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
