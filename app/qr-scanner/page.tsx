'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Camera, Check, AlertCircle } from 'lucide-react'

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<{ id: string; timestamp: Date }>>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)

        // Start scanning loop
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const video = videoRef.current

        const scanFrame = () => {
          if (!isScanning) return

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)

          // Simulate QR code detection with dummy data
          // In production, use a library like jsQR or ZXing.js
          console.log('[v0] Scanning frame...')

          requestAnimationFrame(scanFrame)
        }

        scanFrame()
      }
    } catch (error) {
      console.error('[v0] Camera access error:', error)
      alert('Unable to access camera')
    }
  }

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setIsScanning(false)
    }
  }

  const handleSimulatedScan = (jobNo: string) => {
    setLastScanned(jobNo)
    setScanHistory(prev => [
      { id: jobNo, timestamp: new Date() },
      ...prev.slice(0, 9),
    ])
  }

  return (
    <div className="h-full bg-background p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">QR Scanner</h1>
        <p className="text-muted-foreground mt-2">Scan job cards to check in/out</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Scanner Area */}
        <div className="col-span-2">
          <Card className="p-6 border border-border bg-card overflow-hidden">
            {!isScanning ? (
              <div className="bg-slate-900 rounded-lg p-12 flex flex-col items-center justify-center text-white min-h-96">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg mb-6">Scanner ready</p>
                <Button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-96 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-green-500 border-dashed pointer-events-none" />
                </div>
                <Button
                  onClick={stopScanning}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Stop Scanning
                </Button>
              </div>
            )}

            {/* Demo Controls */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Demo: Simulate scans</p>
              <div className="flex gap-2 flex-wrap">
                {['4479', '4480'].map(jobNo => (
                  <Button
                    key={jobNo}
                    onClick={() => handleSimulatedScan(jobNo)}
                    variant="outline"
                    size="sm"
                  >
                    Scan Job {jobNo}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Status & History */}
        <div className="space-y-6">
          {/* Last Scanned */}
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                {lastScanned ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <QrCode className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Last Scanned</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {lastScanned ? `Job ${lastScanned}` : 'None'}
                </p>
              </div>
            </div>
          </Card>

          {/* Scan History */}
          <Card className="p-6 border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-4">Scan History</h3>
            {scanHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans yet</p>
            ) : (
              <div className="space-y-3">
                {scanHistory.map(scan => (
                  <div
                    key={`${scan.id}-${scan.timestamp.getTime()}`}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg"
                  >
                    <span className="font-medium text-foreground">Job {scan.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status */}
          <Card className="p-6 border border-border bg-card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Demo Mode</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  This is a prototype. Real QR scanning will be enabled in production.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
