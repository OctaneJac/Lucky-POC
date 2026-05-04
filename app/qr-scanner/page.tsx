'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'

interface ScanResult {
  success: boolean
  message: string
  jobNumber?: string
  currentStage?: number
  stageName?: string
  timestamp: Date
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

  const handleScan = async (jobId: string) => {
    if (!jobId.trim()) {
      alert('Please enter a job ID')
      return
    }

    setIsScanning(true)
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: jobId.trim() }),
      })

      const data = await response.json()

      const result: ScanResult = {
        success: data.success,
        message: data.message,
        jobNumber: data.jobNumber,
        currentStage: data.currentStage,
        stageName: data.stageName,
        timestamp: new Date(),
      }

      setLastResult(result)
      setScanHistory([{ jobId: jobId.trim(), result }, ...scanHistory])
      setJobIdInput('')
    } catch (error) {
      const errorResult: ScanResult = {
        success: false,
        message: `Error scanning job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setLastResult(errorResult)
      setScanHistory([{ jobId: jobId.trim(), result: errorResult }, ...scanHistory])
    } finally {
      setIsScanning(false)
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Job Scanner</h1>
          <p className="text-muted-foreground">
            Scan job barcodes to check in/out and move through stages
          </p>
        </div>

        {/* Scan Input Section */}
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
                  disabled={isScanning}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleScan(jobIdInput)}
                  disabled={isScanning || !jobIdInput.trim()}
                  className="px-6"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: On a mobile device, use a barcode scanner app to scan the barcode on the job cards.
                The scanned data will be auto-filled in this field.
              </p>
            </div>
          </div>
        </Card>

        {/* Last Scan Result */}
        {lastResult && (
          <Card
            className={`p-6 border-2 ${
              lastResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {lastResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {lastResult.success ? 'Scan Successful' : 'Scan Failed'}
                </h3>
                <p className={`text-sm mt-1 ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastResult.message}
                </p>
                {lastResult.jobNumber && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={lastResult.success ? 'text-green-900' : 'text-red-900'}>
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

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-xs"
              >
                Clear History
              </Button>
            </div>

            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <Card
                  key={index}
                  className={`p-4 border-l-4 ${
                    scan.result.success
                      ? 'border-l-green-500 bg-green-50'
                      : 'border-l-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          Job ID: {scan.jobId}
                        </h3>
                        {scan.result.jobNumber && (
                          <span className="text-sm text-muted-foreground">
                            (#{scan.result.jobNumber})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {scan.result.message}
                      </p>
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
                      {scan.result.success ? (
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

        {/* Empty State */}
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
