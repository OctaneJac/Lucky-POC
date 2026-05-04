import { NextRequest, NextResponse } from 'next/server'
import { buildScanPreview } from '@/lib/scan-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobId = body?.jobId as string | undefined

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: 'Job ID is required' },
        { status: 400 }
      )
    }

    const preview = await buildScanPreview(jobId)
    if (!preview.success) {
      return NextResponse.json(preview, { status: preview.message === 'Job card not found' ? 404 : 400 })
    }

    return NextResponse.json(preview)
  } catch (error) {
    console.error('Scan preview error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
