'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Barcode } from '@/components/barcode'
import { AlertCircle } from 'lucide-react'

interface JobCardProps {
  jobCard: {
    jcard_id: number
    jcard_no: number
    area: string | null
    model: string | null
    sub_assy_no: string | null
    part_number: string | null
    h_assy_no: string | null
    type: string
    gauge: number
    length: number
    wire_code: string
    wire_tech: string
    color: string
    cir_a: string
    loc_a: number
    slot_a: number
    terminal_a: string
    strip_a: number
    acce_a: string | null
    cir_b: string
    loc_b: number
    slot_b: number
    terminal_b: string
    strip_b: number
    acce_b: string | null
    job: {
      job_id: number
      status: string
      current_stage_id: number | null
      is_flagged: boolean
    } | null
    stageName: string | null
  }
}

const stageColors: Record<string, string> = {
  'Cutting': 'bg-blue-100 text-blue-800',
  'Crimping': 'bg-amber-100 text-amber-800',
  'Sub Assembly': 'bg-purple-100 text-purple-800',
  'Finished': 'bg-green-100 text-green-800',
}

export function JobCard({ jobCard }: JobCardProps) {
  const stageBadgeColor = jobCard.stageName ? stageColors[jobCard.stageName] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
  
  return (
    <Card className="overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
      {/* Header: Job No, Area, and Stage */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold opacity-75">Job No</p>
            <h2 className="text-3xl font-bold">{jobCard.jcard_no}</h2>
            <p className="text-sm mt-2 opacity-90">{jobCard.area || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold opacity-75 mb-2">Current Stage</p>
            {jobCard.stageName ? (
              <Badge className={`${stageBadgeColor} text-sm px-3 py-1`}>
                {jobCard.stageName}
              </Badge>
            ) : (
              <Badge className="bg-gray-600 text-white text-sm px-3 py-1">
                Not Started
              </Badge>
            )}
            {jobCard.job?.is_flagged && (
              <div className="mt-2 flex items-center gap-1 text-orange-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Flagged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Job Details */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Job Details</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sub Assembly</p>
              <p className="font-medium text-foreground">{jobCard.sub_assy_no || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Part Number</p>
              <p className="font-medium text-foreground">{jobCard.part_number || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium text-foreground text-xs">{jobCard.model || '—'}</p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Wire Specification */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Wire Specification</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Type</p>
              <p className="font-medium text-foreground">{jobCard.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Gauge</p>
              <p className="font-medium text-foreground">{jobCard.gauge} mm²</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Length</p>
              <p className="font-medium text-foreground">{jobCard.length} mm</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Color</p>
              <p className="font-medium text-foreground">{jobCard.color}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Wire Code</p>
              <p className="font-medium text-foreground text-xs">{jobCard.wire_code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Wire Tech</p>
              <p className="font-medium text-foreground text-xs">{jobCard.wire_tech}</p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* End A Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
            End A · {jobCard.cir_a}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium text-foreground">{jobCard.loc_a}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Slot</p>
                <p className="font-medium text-foreground">{jobCard.slot_a}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Terminal</p>
                <p className="font-medium text-foreground text-xs">{jobCard.terminal_a}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Strip</p>
                <p className="font-medium text-foreground">{jobCard.strip_a} mm</p>
              </div>
            </div>
          </div>
        </div>

        {/* End B Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
            End B · {jobCard.cir_b}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium text-foreground">{jobCard.loc_b}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Slot</p>
                <p className="font-medium text-foreground">{jobCard.slot_b}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Terminal</p>
                <p className="font-medium text-foreground text-xs">{jobCard.terminal_b}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Strip</p>
                <p className="font-medium text-foreground">{jobCard.strip_b} mm</p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Barcode Section */}
        <div className="flex justify-center">
          <Barcode jobId={jobCard.jcard_id.toString()} displayText="Scan to process job" />
        </div>
      </div>
    </Card>
  )
}
