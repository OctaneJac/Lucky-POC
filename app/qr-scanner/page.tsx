'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2, ScanLine, TriangleAlert, XCircle } from 'lucide-react'

type ScanStep = 'job' | 'terminal' | 'wireType' | 'type' | 'complete'

interface VerificationResponse {
  success: boolean
  message: string
  jobNumber?: string | number
  currentStage?: number
  stageName?: string
}

interface HistoryEntry {
  timestamp: Date
  jobId: string
  success: boolean
  message: string
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function normalize(value: string): string {
  return value.trim()
}

function parsePrefixedScan(raw: string): { field: ScanStep | 'jobId'; value: string } | null {
  const trimmed = raw.trim()
  const [left, ...right] = trimmed.split(':')
  if (right.length === 0) return null

  const key = left.trim().toLowerCase()
  const value = right.join(':').trim()
  if (!value) return null

  if (['job', 'jobid', 'jcard'].includes(key)) return { field: 'jobId', value }
  if (key === 'terminal') return { field: 'terminal', value }
  if (key === 'wiretype' || key === 'wire_type' || key === 'wire') return { field: 'wireType', value }
  if (key === 'type') return { field: 'type', value }
  return null
}

export default function QRScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastDetectionAtRef = useRef<number>(0)
  const mountedRef = useRef(true)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastRawScan, setLastRawScan] = useState<string>('')

  const [step, setStep] = useState<ScanStep>('job')
  const [jobId, setJobId] = useState('')
  const [terminal, setTerminal] = useState('')
  const [wireType, setWireType] = useState('')
  const [type, setType] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<VerificationResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const stepLabel = useMemo(() => {
    switch (step) {
      case 'job':
        return 'Scan job card barcode'
      case 'terminal':
        return 'Scan terminal barcode'
      case 'wireType':
        return 'Scan wire type barcode'
      case 'type':
        return 'Scan type barcode'
      case 'complete':
        return 'Verification complete'
      default:
        return 'Scan barcode'
    }
  }, [step])

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [])

  const commitVerification = async (payload: {
    jobId: string
    terminal: string
    wireType: string
    type: string
  }) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/scan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as VerificationResponse

      setResult(data)
      setHistory((prev) => [
        {
          timestamp: new Date(),
          jobId: payload.jobId,
          success: data.success,
          message: data.message,
        },
        ...prev,
      ])
      setStep('complete')
    } catch (error) {
      const message = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      setResult({ success: false, message })
      setHistory((prev) => [
        {
          timestamp: new Date(),
          jobId: payload.jobId,
          success: false,
          message,
        },
        ...prev,
      ])
      setStep('complete')
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const handleDetectedScan = async (rawValue: string) => {
    if (isSubmitting) return

    const now = Date.now()
    if (now - lastDetectionAtRef.current < 1200) return
    lastDetectionAtRef.current = now
    setLastRawScan(rawValue)

    const parsed = parsePrefixedScan(rawValue)
    const candidate = parsed?.value ?? normalize(rawValue)
    if (!candidate) return

    if (step === 'job') {
      const jobCandidate = parsed?.field === 'jobId' || parsed === null ? candidate : ''
      if (!jobCandidate) return
      setJobId(jobCandidate)
      setStep('terminal')
      return
    }

    if (step === 'terminal') {
      if (parsed && parsed.field !== 'terminal') return
      setTerminal(candidate)
      setStep('wireType')
      return
    }

    if (step === 'wireType') {
      if (parsed && parsed.field !== 'wireType') return
      setWireType(candidate)
      setStep('type')
      return
    }

    if (step === 'type') {
      if (parsed && parsed.field !== 'type') return
      setType(candidate)
      setStep('complete')
      await commitVerification({
        jobId: normalize(jobId),
        terminal: normalize(terminal),
        wireType: normalize(wireType),
        type: normalize(candidate),
      })
    }
  }

  const scanLoop = async () => {
    const video = videoRef.current
    const detector = detectorRef.current
    if (!video || !detector || !cameraActive) return

    if (video.readyState >= 2) {
      try {
        const barcodes = await detector.detect(video)
        const first = barcodes.find((code) => code.rawValue?.trim())
        if (first?.rawValue) {
          await handleDetectedScan(first.rawValue)
        }
      } catch {
        // Keep loop running; detector can fail intermittently on frame reads.
      }
    }

    rafRef.current = requestAnimationFrame(() => {
      void scanLoop()
    })
  }

  const startCamera = async () => {
    setCameraError(null)
    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector

    if (!Detector) {
      setCameraError('Barcode scanning is not supported on this browser. Use Chrome on mobile.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })

      streamRef.current = stream
      detectorRef.current = new Detector({
        formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }

      setCameraActive(true)
      rafRef.current = requestAnimationFrame(() => {
        void scanLoop()
      })
    } catch (error) {
      setCameraError(
        `Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      stopCamera()
    }
  }

  const resetFlow = () => {
    setStep('job')
    setJobId('')
    setTerminal('')
    setWireType('')
    setType('')
    setResult(null)
    setLastRawScan('')
    lastDetectionAtRef.current = 0
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Demo Barcode Verification</h1>
          <p className="text-muted-foreground">
            Scan the job card first, then scan terminal, wire type, and type cards. The job advances
            only if all 3 scans match the job card data.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Camera Scanner</p>
              <p className="text-xs text-muted-foreground">{stepLabel}</p>
            </div>
            <div className="flex gap-2">
              {cameraActive ? (
                <Button variant="outline" onClick={stopCamera}>
                  Stop camera
                </Button>
              ) : (
                <Button onClick={startCamera}>
                  <ScanLine className="w-4 h-4 mr-2" />
                  Start camera
                </Button>
              )}
              <Button variant="secondary" onClick={resetFlow} disabled={isSubmitting}>
                New scan
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-black/80 overflow-hidden">
            <video ref={videoRef} className="w-full h-[300px] object-cover" muted />
          </div>

          {cameraError && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <TriangleAlert className="w-4 h-4" />
              {cameraError}
            </p>
          )}

          {lastRawScan && (
            <p className="text-xs text-muted-foreground">
              Last detected barcode: <span className="font-mono">{lastRawScan}</span>
            </p>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <p className="text-sm font-semibold">Captured values</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={jobId} placeholder="Job card ID" readOnly />
            <Input value={terminal} placeholder="Terminal" readOnly />
            <Input value={wireType} placeholder="Wire type" readOnly />
            <Input value={type} placeholder="Type" readOnly />
          </div>

          <p className="text-xs text-muted-foreground">
            Supported barcode values can be plain text, or prefixed values like{' '}
            <span className="font-mono">terminal:XYZ</span>,{' '}
            <span className="font-mono">wireType:ABC</span>, <span className="font-mono">type:DEF</span>,{' '}
            <span className="font-mono">job:123</span>.
          </p>
        </Card>

        {(isSubmitting || result) && (
          <Card
            className={`p-5 border-2 ${
              result?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : result?.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {isSubmitting ? 'Verifying scans...' : result?.success ? 'Verification passed' : 'Verification failed'}
                </p>
                {!isSubmitting && result && <p className="text-sm text-foreground">{result.message}</p>}
              </div>
            </div>
          </Card>
        )}

        {history.length > 0 && (
          <Card className="p-5 space-y-3">
            <p className="text-sm font-semibold">Recent attempts</p>
            <div className="space-y-2">
              {history.slice(0, 6).map((entry, idx) => (
                <div
                  key={`${entry.timestamp.toISOString()}-${idx}`}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    entry.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className="font-medium">Job {entry.jobId}</p>
                  <p>{entry.message}</p>
                  <p className="text-xs text-muted-foreground">{entry.timestamp.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
