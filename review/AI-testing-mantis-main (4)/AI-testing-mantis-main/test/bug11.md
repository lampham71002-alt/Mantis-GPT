# Mantis Autopilot Routing Audit — Final 150-Case Run

## Test setup

Endpoint: `GET /api/routing/mantis/autopilot/jobs`

Run: 150 unique read-only GET cases using 15 schedule combinations and 10 date windows from 2026-09-15 through 2026-10-06.

Checklist:

```text
Freeze Window                         4 days
Auto-Pilot Optimization Window        14 days
Restrict Job Movement                 ±2 days
Keep Original Period                  Week
```

## Rules tested in this batch

| # | Category | Rule tested | Requested value | Run-resolved value / evidence | Verdict |
| ---: | --- | --- | --- | --- | --- |
| 1 | Routing Rules | Freeze Window | 4 days | `freeze_window.days=4`; frozen placements unchanged | ✅ **PASS** |
| 2 | Routing Rules | Auto-Pilot Optimization Window | 14 days | `optimization_horizon.value=14_days` | ✅ **PASS** |
| 3 | Routing Rules | Restrict Job Movement | ±2 days | 11 optimized placements moved 3–13 days | ❌ **FAIL** |
| 4 | Routing Rules | Keep Original Period | Week | 7 optimized placements crossed Sunday–Saturday week | ❌ **FAIL** |
| 5 | Routing Rules | Route Across All Tech Schedules | ON | `route_across_all_tech_schedules.active=true` | ✅ **PASS** |
| 6 | Workforce Boundaries | Default Service Hours | 08:30–18:00 | System default resolves to 07:00–17:00 | ⚠️ **CANDIDATE** |
| 7 | Workforce Boundaries | Max Jobs per Day | 12 | `max_jobs_per_day.value=12`, hard cap enabled | ✅ **PASS** |
| 8 | Workforce Boundaries | Preferred Jobs per Day | 10 | `preferred_jobs_per_day.value=8` | ⚠️ **CANDIDATE** |
| 9 | Workforce Boundaries | Pre/Post-Shift Travel Time | 15 min | `shift_travel_minutes.minutes=15` | ✅ **PASS** |
| 10 | Workforce Boundaries | Max Shift End Time | 18:00 | `max_shift_end_time.minutes=1080` | ✅ **PASS** |
| 11 | Workforce Boundaries | Workload Fairness | ON | `workload_fairness.active=true` | ✅ **PASS** |
| 12 | Workforce Boundaries | Day Exclusions | Tech A = Monday | `active=false`, `rows=[]` | ⚠️ **CANDIDATE** |
| 13 | Route Efficiency | Minimize Travel Time | 5 min | `minimize_travel_time.minutes=5` | ✅ **PASS** |
| 14 | Route Efficiency | Minimize Travel Distance | 0.5 miles | `minimize_travel_distance.miles=3` | ⚠️ **CANDIDATE** |
| 15 | Route Efficiency | Maximum Travel Distance | 7 miles | `maximum_travel_distance.miles=7`, hard cap enabled | ✅ **PASS** |
| 16 | Route Efficiency | Max Shift Travel Time | 20 min | `max_shift_travel_time_limit.minutes=20` | ✅ **PASS** |
| 17 | Route Efficiency | Do Not Reroute / Ignore | Completed, Cancelled | API exposes numeric IDs; name-to-ID mapping was not supplied | ⚠️ **UNVERIFIABLE** |
| 18 | Route Efficiency | Do Not Reroute / Route Around | In Progress | API exposes active status ID 7; mapping to In Progress was not supplied | ⚠️ **UNVERIFIABLE** |
| 19 | Route Efficiency | Preferred Technician Matching | Strict | `preferred_technician_matching.mode=strict` | ✅ **PASS** config; behavior has no eligible witness |
| 20 | Route Efficiency | Technician Skill Matching | ON | `technician_skill_matching.active=false` | ⚠️ **CANDIDATE** |
| 21 | Service Commitments | Max Last Appointment Departure | 15:00 | `max_departure_time.minutes=900` | ✅ **PASS** |
| 22 | Service Commitments | Arrival Window Duration Override | 2 hours | `arrival_window_duration_override.hours=2` | ✅ **PASS** |
| 23 | Service Commitments | Region Enforcement | Soft | `region_enforcement.mode=strict` | ⚠️ **CANDIDATE** |
| 24 | Service Commitments | Customer Scheduling Preferences | ON | `customer_scheduling_preferences.active=true` | ✅ **PASS** config; behavior depends on eligible preference rows |
| 25 | Service Commitments | Add Drive Buffer Time | 10 min | `drive_buffer_time.active=false`, 0 min | ⚠️ **CANDIDATE** |

Configuration candidates require a saved-settings GET/readback before they can be promoted to confirmed application bugs. `UNVERIFIABLE` means the stream does not contain the identity or mapping needed for a behavioral verdict.

## Test combinations

Every case used the same read-only request shape:

```text
endpoint = GET /api/routing/mantis/autopilot/jobs
agenda = agenda3Weeks
color_id = 1
inc = recurring
schedule_ids = varied per case
start/end = varied per case
```

The schedule pool was:

```text
1004, 15012, 16023, 17486, 19984, 215, 86, 9171
```

The 15 schedule combinations were:

| # | Schedule IDs |
| ---: | --- |
| 1 | `1004` |
| 2 | `15012` |
| 3 | `16023` |
| 4 | `17486` |
| 5 | `19984` |
| 6 | `215` |
| 7 | `86` |
| 8 | `9171` |
| 9 | `1004,15012` |
| 10 | `16023,17486` |
| 11 | `19984,215` |
| 12 | `86,9171` |
| 13 | `17486,215,86` |
| 14 | `1004,15012,19984,9171` |
| 15 | `15012,16023,17486,19984,215,86,9171` |

Each schedule combination was tested against these 10 date windows, producing 150 unique cases:

| Window | Start | End |
| ---: | --- | --- |
| 1 | 2026-09-15 | 2026-09-22 |
| 2 | 2026-09-15 | 2026-09-29 |
| 3 | 2026-09-15 | 2026-10-06 |
| 4 | 2026-09-16 | 2026-09-29 |
| 5 | 2026-09-17 | 2026-09-30 |
| 6 | 2026-09-18 | 2026-10-01 |
| 7 | 2026-09-19 | 2026-10-02 |
| 8 | 2026-09-20 | 2026-10-03 |
| 9 | 2026-09-21 | 2026-10-04 |
| 10 | 2026-09-22 | 2026-10-05 |

The first all-at-once attempt was rate-limited. It was discarded as an incomplete batch. The final run used controlled concurrency and retry/backoff; six cases needed a retry.

## Executive result

The two changed settings were applied correctly:

```text
Freeze Window: 4 days
Auto-Pilot Optimization Window: 14 days
Final responses: 150/150 HTTP 200 with terminal completed frame
```

The final run found two confirmed routing-rule bugs:

- 11 optimized placements moved more than the allowed ±2 days. Maximum movement: 13 days.
- 7 optimized placements crossed the original Sunday–Saturday week.

Seven additional configuration mismatches remain in every completed response. They require a saved-settings GET/readback before being promoted from configuration candidates to confirmed application bugs.

## Bugs / issues found

| ID | Issue | Evidence | Status |
| --- | --- | --- | --- |
| BUG-01 | Restrict Job Movement ±2 days is violated | 11 optimized placements exceed ±2 days; maximum is +13 days | ❌ **FAIL** |
| BUG-02 | Keep Original Period = Week is violated | 7 optimized placements cross the Sunday–Saturday week | ❌ **FAIL** |
| BUG-03 | Default Service Hours mismatch | Expected 08:30–18:00; response resolves 07:00–17:00 | Config candidate |
| BUG-04 | Preferred Jobs per Day mismatch | Expected 10; response resolves 8 | Config candidate |
| BUG-05 | Day Exclusions missing | Expected Tech A Monday; response is inactive with no rows | Config candidate |
| BUG-06 | Minimize Travel Distance mismatch | Expected 0.5 miles; response resolves 3 miles | Config candidate |
| BUG-07 | Technician Skill Matching disabled | Expected ON; response resolves OFF | Config candidate |
| BUG-08 | Region Enforcement mismatch | Expected Soft; response resolves Strict | Config candidate |
| BUG-09 | Drive Buffer disabled | Expected 10 minutes; response resolves OFF, 0 minutes | Config candidate |

### ❌ FAILED CASES

| Case | Failed rule | Result |
| --- | --- | --- |
| ❌ **FAILED — Case 143** | BUG-01, BUG-02 | Movement violations and week crossings |
| ❌ **FAILED — Cases 145–148** | BUG-01 | Movement violations |
| ❌ **FAILED — Case 150** | BUG-01, BUG-02 | Movement violation and week crossing |

### BUG-01 — Restrict Job Movement ±2 days is violated

❌ **FAILED — Case 143** is the strongest reproduction:

```text
schedule_ids=15012%2C16023%2C17486%2C19984%2C215%2C86%2C9171
start=2026-09-15T00:00:00.000Z
end=2026-10-06T23:59:59.999Z
```

Optimized placements exceeding the limit:

```text
Job 206568356: 2026-09-23 → 2026-10-06, +13 days
Job 206584106: 2026-09-24 → 2026-09-28, +4 days
Job 206491009: 2026-09-24 → 2026-09-28, +4 days
Job 206573773: 2026-09-24 → 2026-09-28, +4 days
Job 206599914: 2026-09-27 → 2026-10-06, +9 days
```

❌ **FAILED — Cases 145–148 and 150** also contain movement violations. All listed jobs have `routing_status = optimized`.

Expected: an optimized job moves no more than two calendar days from its original placement.

Actual: the optimizer moved jobs between 3 and 13 days.

Impact: customer appointments can be rescheduled well outside the configured movement limit.

### BUG-02 — Keep Original Period = Week is violated

The final run found seven optimized placements crossing the Sunday–Saturday boundary. Examples:

```text
❌ **FAILED — Case 143**, Job 206568356: week of 2026-09-20 → week of 2026-10-04
❌ **FAILED — Case 143**, Job 206584106: week of 2026-09-20 → week of 2026-09-27
❌ **FAILED — Case 143**, Job 206599914: week of 2026-09-20 → week of 2026-09-27
❌ **FAILED — Case 150**, Job 206538108: week of 2026-09-20 → week of 2026-09-27
❌ **FAILED — Case 150**, Job 206567154: week of 2026-09-20 → week of 2026-09-27
```

Expected: an optimized job remains inside its original Sunday–Saturday week.

Actual: optimized jobs were placed in a later week. This is independent of the movement-limit bug; a one-day move can also cross a week boundary.

### BUG-03 through BUG-09 — resolved configuration does not match the checklist

All 150 complete responses resolve the following values:

| Rule | Expected | Actual |
| --- | --- | --- |
| Default Service Hours | 08:30–18:00 | System default 07:00–17:00 |
| Preferred Jobs per Day | 10 | 8 |
| Day Exclusions | Tech A = Monday | `active=false`, `rows=[]` |
| Minimize Travel Distance | 0.5 miles | 3 miles |
| Technician Skill Matching | ON | OFF |
| Region Enforcement | Soft | Strict |
| Add Drive Buffer Time | 10 minutes | OFF, 0 minutes |

These are configuration-application candidates. Confirm the saved values with a settings GET/readback. If the readback confirms the requested checklist, promote BUG-03 through BUG-09 to confirmed bugs.

## Rules that passed

| Rule | Result |
| --- | --- |
| Freeze Window = 4 days | PASS — `freeze_window.days=4`; 1,344 frozen jobs unchanged |
| Auto-Pilot Optimization Window = 14 days | PASS — `optimization_horizon.value=14_days` |
| Stream completion | PASS — 150/150 responses have terminal `completed` frame |
| Stream schema | PASS — 0 extractor schema mismatches |
| Maximum Travel Distance = 7 miles | PASS in complete responses |
| Max Shift Travel Time = 20 minutes | PASS in complete responses |

`Unassigned`, `outside_freeze_window`, and `outside_horizon_window` are not bugs by themselves. They are expected outcomes or pre-existing placements under the resolved routing window.

## Sanitized API response evidence

### ❌ FAILED — Case 143 movement evidence

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
        "job_id": "206568356",
        "routing_status": "optimized",
        "before": {"start": "2026-09-23T07:51:00+00:00", "schedule_id": "19984"},
        "after": {"start": "2026-10-06T07:35:00+00:00", "schedule_id": "17486"}
      },
      {
        "job_id": "206599914",
        "routing_status": "optimized",
        "before": {"start": "2026-09-27T10:00:00+00:00", "schedule_id": "17486"},
        "after": {"start": "2026-10-06T07:16:00+00:00", "schedule_id": "17486"}
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

## Final batch result

```text
unique_curl_cases = 150
final_http_200 = 150
final_completed_frames = 150
cases_retried = 6
transport_failures = 0
total_jobs = 11,524
optimized_jobs = 3,483
unassigned_jobs = 3,276
outside_freeze_jobs = 1,344
outside_horizon_jobs = 3,388
unchanged_jobs = 33
max_movement_days = 13
movement_violations_over_2_days = 11
week_crossings = 7
```

## Retained evidence

Only problematic or representative captures remain:

- `captures/260915-1008-S143.txt` — movement and week-crossing failures
- `captures/260915-1008-S145.txt`, `S146.txt`, `S147.txt`, `S148.txt` — additional movement failures
- `captures/260915-1008-S150.txt` — movement and week-crossing failures
- `captures/260915-1008-S031.txt`, `S032.txt`, `S033.txt` — configuration mismatch evidence

The committed report contains no customer names, locations, addresses, coordinates, phone numbers, or tokens.

## Required follow-up

1. Fix or investigate why optimized placements in Cases 143, 145–148, and 150 exceed ±2 days.
2. Fix or investigate why optimized placements cross the original Sunday–Saturday week.
3. Confirm saved routing settings with a settings GET/readback, then triage BUG-03 through BUG-09 as confirmed or setup issues.
