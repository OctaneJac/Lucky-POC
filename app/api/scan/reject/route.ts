import { NextRequest, NextResponse } from 'next/server'
import { rejectScan } from '@/lib/scan-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobId = body?.jobId as string | undefined
    const remarks = body?.remarks as string | undefined

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: 'Job ID is required' },
        { status: 400 }
      )
    }

    const result = await rejectScan(jobId, remarks)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Scan reject error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
