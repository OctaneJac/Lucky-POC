# 📦 Job Master Database Schema & Sample Data

## 🧱 Overview

This schema supports:

* Wire/J.Card master data (from Excel)
* Job tracking
* Stage workflow
* Job activity logs

---

# 🗂️ Tables

## 1. `j_cards` (Wire Master Data)

```sql
CREATE TABLE j_cards (
    jcard_id SERIAL PRIMARY KEY,

    jcard_no INT,
    type VARCHAR(50),
    color VARCHAR(10),
    gauge DECIMAL(5,2),

    wire_code VARCHAR(50),
    wire_tech VARCHAR(50),
    length INT,

    cir_a VARCHAR(50),
    loc_a INT,
    slot_a INT,
    terminal_a VARCHAR(50),
    strip_a DECIMAL(5,2),
    acce_a VARCHAR(50),

    cir_b VARCHAR(50),
    loc_b INT,
    slot_b INT,
    terminal_b VARCHAR(50),
    strip_b DECIMAL(5,2),
    acce_b VARCHAR(50),

    joint_no VARCHAR(50),
    joint_direction VARCHAR(50),

    sub_assy_no VARCHAR(50),
    part_number VARCHAR(100),
    h_assy_no VARCHAR(100),

    model VARCHAR(100),
    area VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. `stages`

```sql
CREATE TABLE stages (
    stage_id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL UNIQUE
);
```

---

## 3. `jobs`

```sql
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,

    jcard_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_stage_id INT,
    is_flagged BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (jcard_id) REFERENCES j_cards(jcard_id),
    FOREIGN KEY (current_stage_id) REFERENCES stages(stage_id)
);
```

---

## 4. `job_logs`

```sql
CREATE TABLE job_logs (
    id SERIAL PRIMARY KEY,

    job_id INT NOT NULL,
    stage_id INT NOT NULL,

    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,

    status VARCHAR(50),
    flagged BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    machine_id VARCHAR(100),

    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(stage_id) ON DELETE CASCADE
);
```

---

# 📥 Sample Data

## ✅ Insert J.Cards

```sql
INSERT INTO j_cards (
    jcard_no, type, color, gauge,
    wire_code, wire_tech, length,

    cir_a, loc_a, slot_a, terminal_a, strip_a, acce_a,
    cir_b, loc_b, slot_b, terminal_b, strip_b, acce_b,

    joint_no, joint_direction,
    sub_assy_no, part_number, h_assy_no, model, area
)
VALUES
(
    4479, 'AVSS', 'Y', 0.30,
    'WSS0030500', '0200-00094', 1550,

    'DU19a', 4, 2, '1100-00413', 4.0, NULL,
    'DU19b', 12, 3, '1100-00504', 4.0, NULL,

    NULL, NULL,
    NULL, '91620-P1060-07', 'HA-0105(0.06)', 'RR DR LH PVB', 'Line'
),
(
    4480, 'AVSS', 'P', 0.85,
    'WSS0085F00', '0200-00142', 1535,

    'DU21a', 4, 20, '1100-00420', 3.0, NULL,
    'DU21b', 12, 8, '1100-00505', 4.0, NULL,

    NULL, NULL,
    NULL, '91620-P1060-07', 'HA-0105(0.06)', 'RR DR LH PVB', 'Komax'
);
```

---

## ✅ Insert Stages

```sql
INSERT INTO stages (stage_name)
VALUES
('Backlog') with id=0
('Cutting'),
('Crimping'),
('Sub Assembly'),
('Finished');
('Rejected') with id = 5
```

---

## ✅ Insert Jobs

```sql
INSERT INTO jobs (jcard_id, status, current_stage_id, is_flagged)
VALUES
(
    (SELECT jcard_id FROM j_cards WHERE jcard_no = 4479),
    'Pending', NULL, FALSE
),
(
    (SELECT jcard_id FROM j_cards WHERE jcard_no = 4480),
    'Pending', NULL, FALSE
);
```

---

# 🔗 Relationships

* `jobs.jcard_id` → `j_cards.jcard_id`
* `jobs.current_stage_id` → `stages.stage_id`
* `job_logs.job_id` → `jobs.job_id`
* `job_logs.stage_id` → `stages.stage_id`

---

# 🧠 Notes

* `j_cards` = master data (from Excel)
* `jobs` = execution layer
* `job_logs` = tracking history
* `stages` = workflow control

---

# 🚀 Next Steps (Optional)

* Add triggers for `updated_at`
* Build API layer
* Import full Excel dataset
* Add job quantity & batching

---
