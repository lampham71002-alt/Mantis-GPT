| Rule | Config | Result |
| --- | ---: | --- |
| Freeze Window | Until end of work day | ⚠️ UNVERIFIABLE — frozen technician identity is missing |
| **Optimization Window** | **14 days** | ⚠️ **UNVERIFIABLE — run resolves 7 days** |
| Restrict Job Movement | ±2 days | ✅ PASS — maximum observed movement is 2 days |
| Keep Original Period | Week | ✅ PASS — no Sunday–Saturday week crossing |
| Route Across All Tech Schedules | ON | ⚠️ UNVERIFIABLE — schedule 17486 has no technician identity |
| **Default Service Hours** | **8:30 AM–6:00 PM** | ⚠️ **UNVERIFIABLE — run resolves system default 7:00 AM–5:00 PM** |
| Max Jobs per Day | 12 | ⚠️ UNVERIFIABLE — technician mapping is incomplete |
| **Preferred Jobs per Day** | **10** | ⚠️ **UNVERIFIABLE — run resolves 8** |
| Pre/Post-Shift Travel Time | 15 min | ✅ PASS for the run-resolved value |
| Max Shift End Time | 6:00 PM | ✅ PASS for observed placements |
| Workload Fairness | ON | ⚠️ UNVERIFIABLE — technician mapping is incomplete |
| **Day Exclusions** | **Tech A = Monday** | ⚠️ **UNVERIFIABLE — API returns inactive with no rows** |
| Minimize Travel Time | 5 min | ⚠️ UNVERIFIABLE — before-travel totals are absent |
| **Minimize Travel Distance** | **0.5 miles** | ⚠️ **UNVERIFIABLE — run resolves 3 miles** |
| Maximum Travel Distance | 7 miles | ⚠️ UNVERIFIABLE — return/missing legs make totals lower bounds |
| Max Shift Travel Time | 20 min | ⚠️ UNVERIFIABLE — return/missing legs make totals lower bounds |
| Do Not Reroute / Ignore | Completed, Cancelled | ⚠️ SETTINGS INPUT ERROR — unsupported status values; API is inactive |
| Do Not Reroute / Route Around | In Progress | ⚠️ SETTINGS INPUT ERROR — unsupported status; API exposes status ID 7 |
| Preferred Technician Matching | Strict | ⚠️ UNVERIFIABLE — no preferred-technician witness |
| **Technician Skill Matching** | **ON** | ⚠️ **UNVERIFIABLE — run resolves OFF** |
| Max Last Appointment Departure | 3:00 PM | ⚠️ OPEN QUESTION — one pre-existing outside-horizon job starts exactly at 3:00 PM |
| Arrival Window Duration Override | 2 hours | ⚠️ OPEN QUESTION — observed width uses start−1h to end+1h |
| **Region Enforcement** | **Soft** | ⚠️ **UNVERIFIABLE — run resolves Strict and has no region witness** |
| Customer Scheduling Preferences | ON | ⚠️ UNVERIFIABLE — no before/after preference comparison |
| **Add Drive Buffer Time** | **10 min** | ⚠️ **UNVERIFIABLE — run resolves OFF, 0 min** |

## Candidate bugs

These are configuration-application candidates from the supplied checklist and this Sandbox response. The auditor classification remains `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)` until a saved settings GET/readback confirms that the checklist values were persisted for the same account and run.

## Bug 1 — Optimization Window resolves to 7 days instead of 14 days

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8` · schedules 17486, 86

Sheet case: Routing Rules #4 and #25

```text
Checklist: Optimization Window = 14 days
API features.optimization_horizon.value: 7_days
horizon_start: 2026-09-14
horizon_end: 2026-09-20 23:59:59
requested range end: 2026-10-03 23:59:59
outside_horizon_window: 62
```

Expected: the saved 14-day setting resolves through 2026-09-27.

Actual: the run resolves a 7-day horizon ending 2026-09-20. Jobs outside the horizon are not, by themselves, a placement failure because the Optimization Window is a loading scope.

## Bug 2 — Default Service Hours resolve to 7:00 AM–5:00 PM instead of 8:30 AM–6:00 PM

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Workforce Boundaries #1

```text
Checklist: Default Service Hours = 8:30 AM–6:00 PM
API features.default_service_hours.system_default: true
API base hours: 7:00 AM–5:00 PM
API resolved operating window: 7:15 AM–4:45 PM
optimized starts before requested effective 8:45 AM: 4
```

Expected: the run uses the supplied 8:30 AM–6:00 PM service window with 15 minutes of pre/post-shift travel.

Actual: the run uses the system default 7:00 AM–5:00 PM. Conditional early-placement witnesses include event `206268480` at 8:01 AM and event `206433423` at 8:14 AM.

## Bug 3 — Preferred Jobs per Day resolves to 8 instead of 10

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Workforce Boundaries #3

```text
Checklist: Preferred Jobs per Day = 10
API features.preferred_jobs_per_day.value: 8
API planning_resolved.preferred_jobs_per_day: 8
```

Expected: the soft daily target is 10 jobs.

Actual: the run-resolved target is 8 jobs.

## Bug 4 — Day Exclusions is inactive despite the Tech A Monday setting

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Workforce Boundaries #7

```text
Checklist: Tech A = Monday
API features.day_exclusions.active: false
API features.day_exclusions.rows: []
```

Expected: the configured Monday exclusion row is present in the run-resolved configuration.

Actual: Day Exclusions is inactive and has no rows. The behavioral impact cannot be proven without technician identity and an eligible Monday witness.

## Bug 5 — Technician Skill Matching resolves OFF instead of ON

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Route Efficiency #8

```text
Checklist: Technician Skill Matching = ON
API features.technician_skill_matching.active: false
API planning_resolved.tech_skill_matching: false
```

Expected: service skill eligibility is enforced during routing.

Actual: the run-resolved configuration disables skill matching.

## Bug 6 — Region Enforcement resolves Strict instead of Soft

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Service Commitments #3

```text
Checklist: Region Enforcement = Soft
API features.region_enforcement.mode: strict
API planning_resolved.region_enforcement: strict
job region labels: empty in the supplied stream
```

Expected: out-of-region jobs remain eligible and are deprioritized.

Actual: the run-resolved mode is Strict. No region witness is available to verify the placement effect.

## Bug 7 — Add Drive Buffer Time resolves OFF instead of 10 minutes

Run: S1 · optimization_id `opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8`

Sheet case: Service Commitments #5

```text
Checklist: Add Drive Buffer Time = 10 min
API features.drive_buffer_time.active: false
API features.drive_buffer_time.minutes: 0
API planning_resolved.drive_buffer_min: 0
```

Expected: 10 minutes is added to each applicable drive gap.

Actual: the run-resolved configuration disables the buffer. The stream reports matrix travel only, so buffer application cannot be independently verified.

## Observed but not classified as a bug

Route-around status ID 7 locks event `206398078` / job `206564262`, but the job is `outside_horizon_window`, `in_solver_jobs=false`, and unchanged. There is no eligible status-7 routing witness.

Event `206429894` / job `206596078` starts exactly at 3:00 PM, but it is also `outside_horizon_window` and has no optimized stop. The Max Last Appointment equality rule remains `OPEN QUESTION`.

## Run summary

| Run | Requested schedules | Calendar jobs | Optimized | Unassigned | Outside horizon | Result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| S1 | 17486, 86 | 117 | 19 | 31 | 62 | success |

Raw output: `captures/260915-0903-S1.txt` (local only).

## Sanitized API data response

The following response fields are copied from the terminal `completed` frame and job evidence. Customer names, locations, addresses, coordinates, phone numbers, and tokens are omitted from this committed report.

```json
{
  "type": "completed",
  "success": true,
  "optimization_id": "opt_sandbox_1ccb3e9e370cda0e91a3089214ee10f8",
  "feature_test_log": {
    "schema_version": 12,
    "windows": {
      "horizon_start": "2026-09-14T00:00:00",
      "horizon_end": "2026-09-20T23:59:59",
      "freeze_end": "2026-09-15T00:00:00",
      "placement_start": "2026-09-15T00:00:00",
      "placement_end": "2026-09-21T00:00:00",
      "range_end": "2026-10-03T23:59:59"
    },
    "features": {
      "optimization_horizon": {"value": "7_days"},
      "default_service_hours": {"system_default": true, "start_min": 420, "end_min": 1020},
      "preferred_jobs_per_day": {"value": 8},
      "day_exclusions": {"active": false, "rows": []},
      "technician_skill_matching": {"active": false},
      "region_enforcement": {"active": true, "mode": "strict"},
      "drive_buffer_time": {"active": false, "minutes": 0},
      "route_around_statuses": {"active": true, "statuses": [7]},
      "route_across_all_tech_schedules": {"active": true},
      "max_jobs_per_day": {"value": 12, "is_hard_cap": true},
      "max_shift_travel_time_limit": {"minutes": 20},
      "arrival_window_duration_override": {"hours": 2}
    },
    "summary": {
      "total_calendar_jobs": 117,
      "routed_count": 19,
      "by_status": {
        "outside_freeze_window": 5,
        "optimized": 19,
        "unassigned": 31,
        "outside_horizon_window": 62
      }
    }
  }
}
```

Relevant job evidence:

```json
[
  {
    "event_id": 206268480,
    "job_id": 206434631,
    "routing_status": "optimized",
    "after": {"start": "2026-09-15T08:01:00+00:00", "end": "2026-09-15T08:31:00+00:00", "schedule_id": 86}
  },
  {
    "event_id": 206398078,
    "job_id": 206564262,
    "routing_status": "outside_horizon_window",
    "routing_status_reason": null,
    "job_status": 0,
    "constraints_applied": {"locked": true, "lock_reason": "route_around"},
    "solver_input": {"in_solver_jobs": false},
    "before_after_unchanged": true
  },
  {
    "event_id": 206429894,
    "job_id": 206596078,
    "routing_status": "outside_horizon_window",
    "before_start": "2026-10-01T15:00:00+00:00",
    "after_start": "2026-10-01T15:00:00+00:00",
    "schedule_id": 17486
  }
]
```

## Open questions

- A saved settings GET/readback is required before any candidate above can be classified as a confirmed configuration-application bug.
- Arrival Window Duration Override remains `OPEN QUESTION`: optimized jobs use `[start−1h, end+1h]`, while the sheet formula expects `[start−1h, start+1h]` with service-hours clamping.
- Max Last Appointment equality at exactly 3:00 PM remains `OPEN QUESTION`; the only equality witness is outside the optimization horizon.
- Status ID `7` has no eligible routing witness.
- Schedule 17486 has no technician identity.

## Not verifiable from this curl

- Auto-Pilot activation, Live-route mutation, Accept, Undo, Activity Feed, Dashboard metrics, saved settings persistence, full technician capacity, and soft-objective improvement.
