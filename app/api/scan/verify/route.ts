import { NextRequest, NextResponse } from 'next/server'
import { verifyAndCommitScan } from '@/lib/scan-server'

interface VerifyRequest {
  jobId: string
  terminal: string
  wireType: string
  type: string
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json()
    const { jobId, terminal, wireType, type } = body

    if (!jobId || !terminal || !wireType || !type) {
      return NextResponse.json(
        { success: false, message: 'jobId, terminal, wireType and type are required' },
        { status: 400 }
      )
    }

    const result = await verifyAndCommitScan(jobId, { terminal, wireType, type })
    const status = result.success ? 200 : 400
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error('Scan verify API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
