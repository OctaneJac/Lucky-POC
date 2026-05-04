'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeProps {
  jobId: string
  displayText?: string
}

export function Barcode({ jobId, displayText }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, jobId, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        })
      } catch (error) {
        console.error('Error generating barcode:', error)
      }
    }
  }, [jobId])

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200">
      <svg ref={svgRef} />
      {displayText && <p className="text-sm text-gray-600">{displayText}</p>}
    </div>
  )
}
