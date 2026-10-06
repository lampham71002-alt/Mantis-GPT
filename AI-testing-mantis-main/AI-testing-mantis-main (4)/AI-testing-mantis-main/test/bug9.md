# Mantis Autopilot Routing Audit

> **Superseded by [bug11.md](bug11.md).** The older Freeze2 capture files were cleaned after the final Freeze4/Auto-Pilot14 run.

## Test setup

Endpoint: `GET /api/routing/mantis/autopilot/jobs`

Run: 100 read-only GET requests using `agenda3Weeks`, recurring jobs, varied schedule IDs, and varied date ranges from 2026-09-15 through 2026-10-06.

The active checklist for this run set `Freeze Window = 2 days`. All other values stayed as supplied in the test request.

## Executive result

The Freeze Window change was applied correctly. All 100 responses resolve `freeze_window.days = 2`; 150 frozen jobs kept their original placement and there were zero freeze violations.

The run found **8 configuration mismatches**. They are reproducible in the run-resolved API response. They are currently marked **configuration bug candidates** because the supplied settings were not independently confirmed by a saved-settings GET/readback. Once the readback confirms the checklist values were saved, these should be promoted to confirmed bugs.

## Bugs / issues found

| ID | Rule | Expected | Actual response | Scope | Status |
| --- | --- | --- | --- | ---: | --- |
| BUG-01 | Optimization Window | 14 days | `7_days` | 100/100 | ⚠️ CANDIDATE |
| BUG-02 | Default Service Hours | 08:30–18:00 | System default 07:00–17:00 | 100/100 | ⚠️ CANDIDATE |
| BUG-03 | Preferred Jobs per Day | 10 | 8 | 100/100 | ⚠️ CANDIDATE |
| BUG-04 | Day Exclusions | Tech A excluded Monday | `active=false`, `rows=[]` | 100/100 | ⚠️ CANDIDATE |
| BUG-05 | Minimize Travel Distance | 0.5 miles | 3 miles | 100/100 | ⚠️ CANDIDATE |
| BUG-06 | Technician Skill Matching | ON | OFF | 100/100 | ⚠️ CANDIDATE |
| BUG-07 | Region Enforcement | Soft | Strict | 100/100 | ⚠️ CANDIDATE |
| BUG-08 | Add Drive Buffer Time | 10 minutes | OFF, 0 minutes | 100/100 | ⚠️ CANDIDATE |

### ⚠️ CANDIDATE — BUG-01 — Optimization Window is 7 days instead of 14 days

Reproduce with the retained cases:

```text
⚠️ **CANDIDATE — Case 032**
schedule_ids=17486
start=2026-09-15T00:00:00.000Z
end=2026-09-29T23:59:59.999Z

⚠️ **CANDIDATE — Case 033**
schedule_ids=17486
start=2026-09-15T00:00:00.000Z
end=2026-10-06T23:59:59.999Z
```

Expected:

```text
features.optimization_horizon.value = 14_days
```

Actual:

```text
features.optimization_horizon.value = 7_days
horizon_start = 2026-09-14T00:00:00
horizon_end = 2026-09-20T23:59:59
```

The 14-day and 21-day requests both resolve to a 7-day optimization horizon. Jobs after 2026-09-20 are therefore outside the optimizer's resolved horizon.

### ⚠️ CANDIDATE — BUG-02 — Default Service Hours are 07:00–17:00 instead of 08:30–18:00

Reproduce with ⚠️ **CANDIDATE — Case 031**:

```text
schedule_ids=17486
start=2026-09-15T00:00:00.000Z
end=2026-09-22T23:59:59.999Z
```

Expected:

```text
Default Service Hours = 08:30–18:00
```

Actual:

```text
features.default_service_hours.system_default = true
features.default_service_hours.start_min = 420   # 07:00
features.default_service_hours.end_min = 1020    # 17:00
```

The optimizer is resolving the system default hours instead of the checklist hours. The response's effective operating window is also affected by the 15-minute shift travel rule and the 3:00 PM departure cap.

### ⚠️ CANDIDATE — BUG-03 — Preferred Jobs per Day is 8 instead of 10

Expected:

```text
Preferred Jobs per Day = 10
```

Actual in all 100 responses:

```text
features.preferred_jobs_per_day.value = 8
planning_resolved.preferred_jobs_per_day = 8
```

The daily soft target used by the optimizer is two jobs lower than the requested value. This can change workload balancing and technician allocation.

### ⚠️ CANDIDATE — BUG-04 — Day Exclusions is inactive and contains no Monday rule

Expected:

```text
Tech A = Monday exclusion
```

Actual in all 100 responses:

```text
features.day_exclusions.active = false
features.day_exclusions.rows = []
```

The configured exclusion is absent from the run-resolved configuration. The behavioral effect cannot be proven because the response does not contain the expected exclusion row and technician identity mapping.

### ⚠️ CANDIDATE — BUG-05 — Minimize Travel Distance is 3 miles instead of 0.5 miles

Expected:

```text
Minimize Travel Distance = 0.5 miles
```

Actual in all 100 responses:

```text
planning_resolved.minimize_travel_distance_miles = 3
features.minimize_travel_distance.miles = 3
```

The optimizer is using a different soft travel-distance objective than the requested checklist value.

### ⚠️ CANDIDATE — BUG-06 — Technician Skill Matching is OFF instead of ON

Expected:

```text
Technician Skill Matching = ON
```

Actual in all 100 responses:

```text
features.technician_skill_matching.active = false
planning_resolved.tech_skill_matching = false
```

Required technician skills may not be used as an eligibility constraint during routing.

### ⚠️ CANDIDATE — BUG-07 — Region Enforcement is Strict instead of Soft

Expected:

```text
Region Enforcement = Soft
```

Actual in all 100 responses:

```text
features.region_enforcement.mode = strict
planning_resolved.region_enforcement = strict
```

Strict enforcement can reject or restrict out-of-region jobs where the checklist requires soft prioritization. The supplied stream has no region witness to measure the placement effect.

### ⚠️ CANDIDATE — BUG-08 — Drive Buffer is OFF instead of 10 minutes

Expected:

```text
Add Drive Buffer Time = 10 minutes
```

Actual in all 100 responses:

```text
features.drive_buffer_time.active = false
features.drive_buffer_time.minutes = 0
planning_resolved.drive_buffer_min = 0
```

The 10-minute safety buffer is not included in the resolved routing configuration. Drive values in the stream therefore represent matrix travel without the requested buffer.

## Rules that passed this run

| Rule | Result |
| --- | --- |
| Freeze Window = 2 days | PASS — 150 frozen jobs unchanged; 0 violations |
| Restrict Job Movement = ±2 days | PASS — maximum observed movement 2 days |
| Keep Original Period = Week | PASS — 0 week crossings |
| Stream schema | PASS — 0 schema mismatches |
| Route Around locks | No eligible in-solver violation observed |

`Unassigned`, `outside_freeze_window`, and `outside_horizon_window` statuses are not bugs by themselves. They are expected outcomes or pre-existing placements under the resolved routing window and were not counted as routing failures.

## Sanitized API response evidence

```json
{
  "type": "completed",
  "success": true,
  "feature_test_log": {
    "windows": {
      "horizon_start": "2026-09-14T00:00:00",
      "horizon_end": "2026-09-20T23:59:59",
      "freeze_end": "2026-09-16T00:00:00"
    },
    "features": {
      "freeze_window": {"days": 2},
      "optimization_horizon": {"value": "7_days"},
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
}
```

## Test result

```text
curl_requests = 100
http_200 = 100
transport_failures = 0
total_jobs_in_responses = 5,824
optimized_jobs = 507
unassigned_jobs = 803
outside_freeze_jobs = 150
outside_horizon_jobs = 4,350
unchanged_jobs = 14
```

Historical raw evidence from this superseded Freeze2 run was cleaned. Final evidence is retained under `captures/` and documented in [bug11.md](bug11.md).

The committed report contains no customer names, locations, addresses, coordinates, phone numbers, or tokens.

## Required follow-up

Run the routing settings GET/readback for the same account and compare the saved values with the checklist. If the readback confirms the requested values, promote BUG-01 through BUG-08 to confirmed configuration-application bugs. If the readback also returns the actual values above, update the test setup before rerunning the route behavior tests.
