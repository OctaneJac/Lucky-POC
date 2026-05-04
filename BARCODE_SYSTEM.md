# Barcode Scanning System

## Overview

The Assembly Line Tracker includes a complete barcode-based job tracking system that manages job progression through 4 manufacturing stages.

## How It Works

### Stage Progression Flow

Each job goes through the following workflow:

1. **First Scan**: Creates a log entry with check-in time (Stage 1 / Start)
2. **Second Scan**: Adds checkout time to the current stage log
3. **Third Scan**: Moves job to the next stage with check-in time
4. **Repeat**: Continue scanning at each stage transition until job reaches Stage 4 (Finished)

### API Endpoint

**POST** `/api/scan`

**Request Body:**
```json
{
  "jobId": "1"
}
```

**Response Example (First Scan):**
```json
{
  "success": true,
  "message": "Job 4479 checked into Stage 1 (Start)",
  "jobNumber": 4479,
  "currentStage": 1,
  "stageName": "Start",
  "jobLog": {
    "log_id": 1,
    "jcard_id": 1,
    "current_stage_id": 1,
    "check_in": "2026-05-04T06:10:57.531Z",
    "check_out": null
  }
}
```

## Barcode Display

### Job Cards Page
- Each job card displays a CODE128 barcode at the bottom
- Barcode encodes the job ID (`jcard_id`)
- Display text: "Scan to process job"

### Barcode Component
Located at: `/components/barcode.tsx`

Generates barcodes using the `jsbarcode` library with the following specifications:
- **Format**: CODE128
- **Width**: 2
- **Height**: 50px
- **Display Value**: Yes (shows job ID below barcode)
- **Margin**: 10px

## QR Scanner Page

Located at: `/app/qr-scanner/page.tsx`

### Features
- Manual job ID input field
- Real-time scan results with visual feedback
- Scan history tracking with timestamps
- Stage badges with color coding:
  - Blue: Stage 1 (Start)
  - Amber: Stage 2 (Cutting)
  - Purple: Stage 3 (Crimping)
  - Green: Stage 4 (Finished)

### Mobile Usage
The scanner page is designed for mobile devices:
1. Open the scanner page on your phone/tablet
2. Use a barcode scanner app to scan the CODE128 barcode on job cards
3. The scanned data (job ID) is auto-filled in the input field
4. Click "Scan" or press Enter to process the job

## Database Tables

### job_logs Table
Stores all job progression records:
- `id`: Primary key
- `job_id`: Reference to jobs table
- `stage_id`: Current stage (1-4)
- `check_in_time`: When job entered the stage
- `check_out_time`: When job left the stage (null until second scan)
- `status`: Job status
- `flagged`: Whether job needs attention
- `remarks`: Any notes about the job
- `machine_id`: Which machine processed the job

### jobs Table
Tracks current job status:
- `job_id`: Primary key
- `jcard_id`: Reference to j_cards (master data)
- `current_stage_id`: Current stage (1-4)
- `status`: Job status
- `is_flagged`: Whether job needs attention

## Example Workflow

```
Job 4479 Processing:
├── Scan 1: Check in → Stage 1 (Start)
│   └── Creates: log_id=1, stage_id=1, check_in_time=..., check_out_time=null
├── Scan 2: Check out → Stage 1
│   └── Updates: check_out_time=...
├── Scan 3: Move to Stage 2 (Cutting)
│   └── Creates: log_id=2, stage_id=2, check_in_time=..., check_out_time=null
│   └── Updates: jobs.current_stage_id = 2
├── Scan 4: Check out → Stage 2
│   └── Updates: check_out_time=...
├── Scan 5: Move to Stage 3 (Crimping)
│   └── Creates: log_id=3, stage_id=3, check_in_time=..., check_out_time=null
│   └── Updates: jobs.current_stage_id = 3
├── Scan 6: Check out → Stage 3
│   └── Updates: check_out_time=...
├── Scan 7: Move to Stage 4 (Finished)
│   └── Creates: log_id=4, stage_id=4, check_in_time=..., check_out_time=null
│   └── Updates: jobs.current_stage_id = 4
└── Scan 8: Check out → Stage 4
    └── Updates: check_out_time=...
    └── Job Complete
```

## Stage Definitions

- **Stage 1**: Start (Backlog)
- **Stage 2**: Cutting
- **Stage 3**: Crimping
- **Stage 4**: Sub Assembly / Finished

## Error Handling

The API returns appropriate error responses:

**Job Not Found** (404):
```json
{
  "success": false,
  "message": "Job card not found"
}
```

**Already Finished** (400):
```json
{
  "success": false,
  "message": "Job 4479 is already in the Finished stage"
}
```

**Server Error** (500):
```json
{
  "success": false,
  "message": "Internal server error"
}
```
