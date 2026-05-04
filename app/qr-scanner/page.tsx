'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle, Flag, Loader2, XCircle } from 'lucide-react'

type PendingAction = 'check_in' | 'check_out' | 'advance' | 'already_finished'

interface PreviewData {
  jobNumber: number
  jcardId: number
  currentStageId: number | null
  stageName: string | null
  pendingAction: PendingAction
  summary: string
}

interface ScanResult {
  success: boolean
  message: string
  jobNumber?: string
  currentStage?: number
  stageName?: string
  timestamp: Date
  rejected?: boolean
}

interface ScanHistory {
  jobId: string
  result: ScanResult
}

export default function QRScannerPage() {
  const [jobIdInput, setJobIdInput] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [confirmAction, setConfirmAction] = useState<'proceed' | 'reject' | null>(null)

  const resetDialog = () => {
    setConfirmOpen(false)
    setPendingJobId(null)
    setPreview(null)
    setRejectRemarks('')
    setConfirmAction(null)
  }

  const openPreviewError = (jobId: string, message: string) => {
    const result: ScanResult = {
      success: false,
      message,
      timestamp: new Date(),
    }
    setLastResult(result)
    setScanHistory((h) => [{ jobId, result }, ...h])
  }

  const handleScan = async (jobId: string) => {
    if (!jobId.trim()) {
      alert('Please enter a job ID')
      return
    }

    const trimmed = jobId.trim()
    setIsScanning(true)
    try {
      const response = await fetch('/api/scan/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: trimmed }),
      })

      const data = await response.json()

      if (!data.success) {
        openPreviewError(trimmed, data.message ?? 'Preview failed')
        setJobIdInput('')
        return
      }

      setPendingJobId(trimmed)
      setPreview({
        jobNumber: data.jobNumber,
        jcardId: data.jcardId,
        currentStageId: data.currentStageId,
        stageName: data.stageName,
        pendingAction: data.pendingAction,
        summary: data.summary,
      })
      setRejectRemarks('')
      setConfirmOpen(true)
      setJobIdInput('')
    } catch (error) {
      openPreviewError(
        trimmed,
        `Error loading scan: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsScanning(false)
    }
  }

  const handleProceed = async () => {
    if (!pendingJobId) return

    setConfirmAction('proceed')
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: pendingJobId }),
      })

      const data = await response.json()

      const result: ScanResult = {
        success: data.success,
        message: data.message,
        jobNumber: data.jobNumber != null ? String(data.jobNumber) : undefined,
        currentStage: data.currentStage,
        stageName: data.stageName,
        timestamp: new Date(),
      }

      setLastResult(result)
      setScanHistory((h) => [{ jobId: pendingJobId, result }, ...h])
      resetDialog()
    } catch (error) {
      const result: ScanResult = {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setLastResult(result)
      setScanHistory((h) => [{ jobId: pendingJobId, result }, ...h])
      resetDialog()
    }
  }

  const handleReject = async () => {
    if (!pendingJobId) return

    setConfirmAction('reject')
    try {
      const response = await fetch('/api/scan/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: pendingJobId,
          remarks: rejectRemarks.trim() || undefined,
        }),
      })

      const data = await response.json()

      const result: ScanResult = {
        success: data.success,
        message: data.message ?? (data.success ? 'Job flagged' : 'Reject failed'),
        jobNumber: data.jobNumber != null ? String(data.jobNumber) : undefined,
        timestamp: new Date(),
        rejected: data.success,
      }

      setLastResult(result)
      setScanHistory((h) => [{ jobId: pendingJobId, result }, ...h])
      resetDialog()
    } catch (error) {
      const result: ScanResult = {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setLastResult(result)
      setScanHistory((h) => [{ jobId: pendingJobId, result }, ...h])
      resetDialog()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobIdInput(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan(jobIdInput)
    }
  }

  const clearHistory = () => {
    setScanHistory([])
    setLastResult(null)
  }

  const stageColors: Record<number, string> = {
    1: 'bg-blue-50 border-blue-200 text-blue-900',
    2: 'bg-amber-50 border-amber-200 text-amber-900',
    3: 'bg-purple-50 border-purple-200 text-purple-900',
    4: 'bg-green-50 border-green-200 text-green-900',
  }

  const proceedDisabled = preview?.pendingAction === 'already_finished'

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Job Scanner</h1>
          <p className="text-muted-foreground">
            Scan job barcodes to check in/out and move through stages
          </p>
        </div>

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open && !confirmAction) {
              resetDialog()
            }
          }}
        >
          <DialogContent showCloseButton={!confirmAction} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm scan</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-left">
                  {preview && (
                    <>
                      <p className="text-foreground text-sm font-medium">{preview.summary}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Card ID: <span className="font-mono">{preview.jcardId}</span>
                        </p>
                        {preview.stageName != null && preview.currentStageId != null && (
                          <p>
                            Current stage: {preview.stageName} ({preview.currentStageId})
                          </p>
                        )}
                      </div>
                      {proceedDisabled && (
                        <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-md p-2">
                          This job is already finished — Proceed is disabled. You can still flag it
                          with Reject.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="reject-remarks" className="text-sm font-medium text-foreground">
                Remarks (optional, saved on job log when rejecting)
              </label>
              <Textarea
                id="reject-remarks"
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Reason for reject…"
                disabled={!!confirmAction}
                rows={3}
                className="resize-none"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={!!confirmAction}
              >
                {confirmAction === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Reject &amp; flag
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleProceed}
                disabled={!!confirmAction || proceedDisabled}
              >
                {confirmAction === 'proceed' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Proceed'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="p-6 border-2 border-border">
          <div className="space-y-4">
            <div>
              <label htmlFor="job-id" className="block text-sm font-semibold text-foreground mb-2">
                Job ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="job-id"
                  type="text"
                  placeholder="Enter job ID or scan barcode..."
                  value={jobIdInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  disabled={isScanning || confirmOpen}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleScan(jobIdInput)}
                  disabled={isScanning || !jobIdInput.trim() || confirmOpen}
                  className="px-6"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: On a mobile device, use a barcode scanner app to scan the barcode on the job
                cards. The scanned data will be auto-filled in this field.
              </p>
            </div>
          </div>
        </Card>

        {lastResult && (
          <Card
            className={`p-6 border-2 ${
              lastResult.rejected
                ? 'border-amber-200 bg-amber-50'
                : lastResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {lastResult.rejected ? (
                  <Flag className="w-6 h-6 text-amber-700" />
                ) : lastResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold ${
                    lastResult.rejected
                      ? 'text-amber-900'
                      : lastResult.success
                        ? 'text-green-900'
                        : 'text-red-900'
                  }`}
                >
                  {lastResult.rejected ? 'Flagged' : lastResult.success ? 'Scan Successful' : 'Scan Failed'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    lastResult.rejected
                      ? 'text-amber-900'
                      : lastResult.success
                        ? 'text-green-800'
                        : 'text-red-800'
                  }`}
                >
                  {lastResult.message}
                </p>
                {lastResult.jobNumber && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span
                        className={
                          lastResult.rejected
                            ? 'text-amber-900'
                            : lastResult.success
                              ? 'text-green-900'
                              : 'text-red-900'
                        }
                      >
                        Job #:
                      </span>
                      <span className="font-semibold">{lastResult.jobNumber}</span>
                    </div>
                    {lastResult.stageName && (
                      <div
                        className={`p-2 rounded text-sm font-semibold text-center border ${
                          stageColors[lastResult.currentStage || 0] || ''
                        }`}
                      >
                        Stage: {lastResult.stageName}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  {lastResult.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {scanHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
              <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs">
                Clear History
              </Button>
            </div>

            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <Card
                  key={index}
                  className={`p-4 border-l-4 ${
                    scan.result.rejected
                      ? 'border-l-amber-500 bg-amber-50'
                      : scan.result.success
                        ? 'border-l-green-500 bg-green-50'
                        : 'border-l-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">Job ID: {scan.jobId}</h3>
                        {scan.result.jobNumber && (
                          <span className="text-sm text-muted-foreground">
                            (#{scan.result.jobNumber})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1">{scan.result.message}</p>
                      {scan.result.stageName && (
                        <div className="mt-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                              stageColors[scan.result.currentStage || 0] || ''
                            }`}
                          >
                            {scan.result.stageName}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {scan.result.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {scan.result.rejected ? (
                        <Flag className="w-5 h-5 text-amber-600" />
                      ) : scan.result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {scanHistory.length === 0 && !lastResult && (
          <Card className="p-12 text-center border-dashed border-2">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No scans yet. Enter a job ID or scan a barcode to get started.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
