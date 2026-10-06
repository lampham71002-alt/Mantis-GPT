# Mantis Autopilot Routing Audit

> **Superseded by [test/bug11.md](bug11.md).** This file records the initial all-at-once batch, where rate limiting and incomplete streams prevented a complete audit. Use `bug11.md` for the final controlled-concurrency 150-case result.

## Test setup

Endpoint: `GET /api/routing/mantis/autopilot/jobs`

Run: 150 read-only GET requests using `agenda3Weeks`, recurring jobs, 15 schedule combinations, and 10 date windows from 2026-09-15 through 2026-10-06.

Checklist for this run:

```text
Freeze Window                         4 days
Auto-Pilot Optimization Window        14 days
Restrict Job Movement                 ±2 days
Keep Original Period                  Week
```

All other checklist values were kept from the supplied routing rules.

## Executive result

Two routing-rule violations were found in ❌ **FAILED — Case 124**:

- Two optimized jobs moved 4 and 6 days, exceeding `Restrict Job Movement = ±2 days`.
- The same two placements crossed from the original Sunday–Saturday week into the next week, violating `Keep Original Period = Week`.

The two changed settings were applied correctly in all 123 complete responses:

```text
Freeze Window: 4 days
Auto-Pilot Optimization Window: 14 days
```

## Bugs / issues found

| ID | Issue | Evidence | Status |
| --- | --- | --- | --- |
| BUG-01 | Restrict Job Movement ±2 days is violated | Case 124 has optimized moves of +6 days and +4 days | ❌ **FAIL** |
| BUG-02 | Keep Original Period = Week is violated | Both Case 124 moves cross the Sunday–Saturday week boundary | ❌ **FAIL** |
| BUG-03 | API rate-limits the 150-request batch | 25 requests return HTTP 429 `Too Many Requests` | Observed reliability issue |
| BUG-04 | API returns incomplete success streams | 2 requests return HTTP 200 without a terminal `completed` frame | Observed response issue |
| BUG-05 | Default Service Hours resolve incorrectly | Expected 08:30–18:00; response resolves 07:00–17:00 | Config mismatch |
| BUG-06 | Preferred Jobs per Day resolves incorrectly | Expected 10; response resolves 8 | Config mismatch |
| BUG-07 | Day Exclusions is missing | Expected Tech A Monday exclusion; response is inactive with no rows | Config mismatch |
| BUG-08 | Minimize Travel Distance resolves incorrectly | Expected 0.5 miles; response resolves 3 miles | Config mismatch |
| BUG-09 | Technician Skill Matching is disabled | Expected ON; response resolves OFF | Config mismatch |
| BUG-10 | Region Enforcement resolves incorrectly | Expected Soft; response resolves Strict | Config mismatch |
| BUG-11 | Drive Buffer is disabled | Expected 10 minutes; response resolves OFF, 0 minutes | Config mismatch |

### ❌ FAILED — Case 124 — Restrict Job Movement ±2 days is violated

Reproduce with ❌ **FAILED — Case 124**:

```text
schedule_ids=17486%2C215%2C86
start=2026-09-16T00:00:00.000Z
end=2026-09-29T23:59:59.999Z
```

Expected: an optimized job may move no more than two calendar days from its original placement.

Actual:

```text
Job 206589679: 2026-09-23 → 2026-09-29, schedule 17486, move = +6 days
Job 206584106: 2026-09-24 → 2026-09-28, schedule 17486, move = +4 days
```

Both jobs have `routing_status = optimized`. The response also reports both placements outside the engine move window.

Impact: the optimizer can move jobs beyond the customer-approved movement limit.

### ❌ FAILED — Case 124 — Keep Original Period = Week is violated

The same ❌ **FAILED — Case 124** placements cross the week boundary:

```text
Original week: Sunday 2026-09-20 through Saturday 2026-09-26
New week:      Sunday 2026-09-27 through Saturday 2026-10-03
```

Expected: an optimized job remains inside its original Sunday–Saturday week.

Actual:

```text
Job 206589679: Wednesday 2026-09-23 → Tuesday 2026-09-29
Job 206584106: Thursday 2026-09-24 → Monday 2026-09-28
```

Impact: a job can be moved into a different service week even when the weekly-period rule is enabled.

### BUG-03 — 25 requests return HTTP 429

The following cases returned:

```text
HTTP 429
{"name":"Too Many Requests","status":429,"success":false}
```

Cases: `113, 116, 119, 123, 127, 128, 130–143, 146–150`.

Expected: each submitted read-only request returns an auditable response.

Actual: 25/150 requests were rejected by the API rate limiter during the batch.

Impact: 16.7% of this batch produced no optimization result. This is an observed concurrency/reliability issue; the expected request-rate limit needs confirmation before assigning a product severity.

### BUG-04 — HTTP 200 responses are incomplete

Cases 144 and 145 returned HTTP 200, but their streams ended before a terminal `completed` frame.

```text
Case 144: 196,985 bytes, no completed frame
Case 145: 184,524 bytes, no completed frame
```

Expected: a successful response contains a terminal optimization result with `type = completed`.

Actual: the response begins with progress/events data and stops before the terminal result.

Impact: the caller can receive HTTP 200 while still being unable to determine whether optimization finished.

### BUG-05 through BUG-11 — resolved configuration does not match the checklist

All 123 complete responses resolve the same values:

| Rule | Expected | Actual |
| --- | --- | --- |
| Default Service Hours | 08:30–18:00 | System default 07:00–17:00 |
| Preferred Jobs per Day | 10 | 8 |
| Day Exclusions | Tech A = Monday | `active=false`, `rows=[]` |
| Minimize Travel Distance | 0.5 miles | 3 miles |
| Technician Skill Matching | ON | OFF |
| Region Enforcement | Soft | Strict |
| Add Drive Buffer Time | 10 minutes | OFF, 0 minutes |

These are configuration-application candidates. A saved-settings GET/readback is required to confirm that the checklist values were persisted before the run. If the readback confirms the requested values, promote BUG-05 through BUG-11 to confirmed bugs.

## Rules that passed

| Rule | Result |
| --- | --- |
| Freeze Window = 4 days | PASS — `freeze_window.days=4`; 768 frozen jobs unchanged |
| Auto-Pilot Optimization Window = 14 days | PASS — `optimization_horizon.value=14_days` |
| Maximum movement outside BUG-01 | No other move exceeded ±2 days |
| Maximum Travel Distance = 7 miles | No routed schedule/day exceeded the cap in complete responses |
| Max Shift Travel Time = 20 minutes | No routed schedule/day exceeded the cap in complete responses |
| Stream schema | 0 extractor schema mismatches in complete responses |

`Unassigned`, `outside_freeze_window`, and `outside_horizon_window` statuses are not bugs by themselves. After-cutoff jobs reported in some streams were pre-existing placements with no optimized stop and were not counted as optimizer failures.

## Sanitized API response evidence

### ❌ FAILED — Case 124 routing evidence

```json
{
  "type": "completed",
  "success": true,
  "feature_test_log": {
    "windows": {
      "horizon_start": "2026-09-14T00:00:00",
      "horizon_end": "2026-09-27T23:59:59",
      "freeze_end": "2026-09-18T00:00:00"
    },
    "jobs": [
      {
        "job_id": "206589679",
        "routing_status": "optimized",
        "before": {"start": "2026-09-23T07:54:00+00:00", "schedule_id": "17486"},
        "after": {"start": "2026-09-29T07:15:00+00:00", "schedule_id": "17486"}
      },
      {
        "job_id": "206584106",
        "routing_status": "optimized",
        "before": {"start": "2026-09-24T08:10:00+00:00", "schedule_id": "17486"},
        "after": {"start": "2026-09-28T07:15:00+00:00", "schedule_id": "17486"}
      }
    ]
  }
}
```

### Resolved configuration evidence

```json
{
  "features": {
    "freeze_window": {"days": 4},
    "optimization_horizon": {"value": "14_days"},
    "default_service_hours": {"system_default": true, "start_min": 420, "end_min": 1020},
    "preferred_jobs_per_day": {"value": 8},
    "day_exclusions": {"active": false, "rows": []},
    "minimize_travel_distance": {"miles": 3},
    "technician_skill_matching": {"active": false},
    "region_enforcement": {"mode": "strict"},
    "drive_buffer_time": {"active": false, "minutes": 0}
  },
  "planning_resolved": {
    "preferred_jobs_per_day": 8,
    "minimize_travel_distance_miles": 3,
    "tech_skill_matching": false,
    "region_enforcement": "strict",
    "drive_buffer_min": 0
  }
}
```

## Batch result

```text
curl_requests = 150
http_200 = 125
http_429 = 25
complete_optimization_responses = 123
incomplete_http_200_responses = 2
total_jobs_in_complete_responses = 6,058
optimized_jobs = 1,822
unassigned_jobs = 1,817
outside_freeze_jobs = 768
outside_horizon_jobs = 1,632
unchanged_jobs = 19
max_movement_days = 6
movement_violations_over_2_days = 2
week_crossings = 2
```

## Retained evidence

Only problematic or representative captures remain:

- `captures/260915-0944-S124.txt` — Restrict and Keep Original Period failures
- `captures/260915-0944-S113.txt`, `S116.txt`, `S119.txt`, `S123.txt`, `S127.txt`, `S128.txt`, `S130.txt`–`S143.txt`, `S146.txt`–`S150.txt` — HTTP 429 responses
- `captures/260915-0944-S144.txt`, `S145.txt` — incomplete HTTP 200 streams
- `captures/260915-0944-S031.txt`, `S032.txt`, `S033.txt` — configuration mismatch evidence

The committed report contains no customer names, locations, addresses, coordinates, phone numbers, or tokens.

## Required follow-up

1. Confirm the saved routing settings with a settings GET/readback.
2. Investigate why the optimizer accepted moves of 4 and 6 days in Case 124 when the limit is ±2 days and the moves also cross the configured week boundary.
3. Confirm the API concurrency/rate-limit contract and ensure incomplete streams cannot be returned as HTTP 200 without a terminal result.
