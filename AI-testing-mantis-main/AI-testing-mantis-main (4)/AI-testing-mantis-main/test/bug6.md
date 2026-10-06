| Rule | Config | Result |
| --- | ---: | --- |
| Freeze Window | Until end of work day | ⚠️ UNVERIFIABLE — frozen technician identity is missing |
| **Optimization Window** | **14 days** | ⚠️ **UNVERIFIABLE — run resolves 7 days** |
| Restrict Job Movement | ±2 days | ✅ PASS — max observed movement is 2 days |
| Keep Original Period | Week | ✅ PASS — no Sunday–Saturday week crossing observed |
| Route Across All Tech Schedules | ON | ⚠️ UNVERIFIABLE — schedules 17486 and 9171 have no technician identity |
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
| Do Not Reroute / Route Around | In Progress | ⚠️ SETTINGS INPUT ERROR — unsupported status value; API exposes status ID 7 |
| Preferred Technician Matching | Strict | ⚠️ UNVERIFIABLE — no preferred-technician witness |
| **Technician Skill Matching** | **ON** | ⚠️ **UNVERIFIABLE — run resolves OFF** |
| Max Last Appointment Departure | 3:00 PM | ✅ PASS — no observed start is after the cutoff |
| Arrival Window Duration Override | 2 hours | ⚠️ OPEN QUESTION — observed width uses start−1h to end+1h |
| **Region Enforcement** | **Soft** | ⚠️ **UNVERIFIABLE — run resolves Strict and has no region witness** |
| Customer Scheduling Preferences | ON | ⚠️ UNVERIFIABLE — no before/after preference comparison |
| **Add Drive Buffer Time** | **10 min** | ⚠️ **UNVERIFIABLE — run resolves OFF, 0 min** |

## Candidate bugs

These findings are configuration-application candidates. The auditor classification remains `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)` until a saved settings GET/readback confirms that the checklist values were persisted for the same account and run.

## Bug 1 — Optimization Window resolves to 7 days instead of 14 days

Run: S1 and S2 · optimization IDs `opt_sandbox_2c0c25423a5a1c89a1b5260afdf04951` and `opt_sandbox_242d91ee1b9b6ccfe5d4b3bda5f76394`

Sheet case: Routing Rules #4 and #25

```text
Checklist: Optimization Window = 14 days
API features.optimization_horizon.value: 7_days
horizon_start: 2026-09-14
horizon_end: 2026-09-20 23:59:59
requested range end: 2026-09-26 23:59:59
outside_horizon_window: S1 = 36, S2 = 46
```

Expected: the saved 14-day setting resolves to a horizon through 2026-09-27.

Actual: both runs resolve a 7-day horizon ending 2026-09-20. The 36/46 outside-horizon jobs are evidence of the resolved run scope, not by themselves a placement failure.

## Bug 2 — Default Service Hours resolve to 7:00 AM–5:00 PM instead of 8:30 AM–6:00 PM

Run: S1 and S2

Sheet case: Workforce Boundaries #1

```text
Checklist: Default Service Hours = 8:30 AM–6:00 PM
API features.default_service_hours.system_default: true
API base hours: 7:00 AM–5:00 PM
API resolved operating window: 7:15 AM–4:45 PM
optimized starts before requested effective 8:45 AM: S1 = 9, S2 = 8
```

Expected: the run uses the supplied 8:30 AM–6:00 PM service window with 15 minutes of pre/post-shift travel.

Actual: the run uses the system default 7:00 AM–5:00 PM. This creates conditional early-placement witnesses, including event `206399347` at 8:44 AM in S1 and event `206268480` at 8:01 AM in S2.

## Bug 3 — Preferred Jobs per Day resolves to 8 instead of 10

Run: S1 and S2

Sheet case: Workforce Boundaries #3

```text
Checklist: Preferred Jobs per Day = 10
API features.preferred_jobs_per_day.value: 8
API planning_resolved.preferred_jobs_per_day: 8
```

Expected: the soft daily target is 10 jobs.

Actual: the run-resolved target is 8 jobs.

## Bug 4 — Day Exclusions is inactive despite the Tech A Monday setting

Run: S1 and S2

Sheet case: Workforce Boundaries #7

```text
Checklist: Tech A = Monday
API features.day_exclusions.active: false
API features.day_exclusions.rows: []
```

Expected: the configured Monday exclusion row is present in the run-resolved configuration.

Actual: Day Exclusions is inactive and has no rows. The technician mapping is also incomplete, so the behavioral impact cannot be proven from these captures.

## Bug 5 — Technician Skill Matching resolves OFF instead of ON

Run: S1 and S2

Sheet case: Route Efficiency #8

```text
Checklist: Technician Skill Matching = ON
API features.technician_skill_matching.active: false
API planning_resolved.tech_skill_matching: false
```

Expected: service skill eligibility is enforced during routing.

Actual: the run-resolved configuration disables skill matching.

## Bug 6 — Region Enforcement resolves Strict instead of Soft

Run: S1 and S2

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

Run: S1 and S2

Sheet case: Service Commitments #5

```text
Checklist: Add Drive Buffer Time = 10 min
API features.drive_buffer_time.active: false
API features.drive_buffer_time.minutes: 0
API planning_resolved.drive_buffer_min: 0
```

Expected: 10 minutes is added to each applicable drive gap.

Actual: the run-resolved configuration disables the buffer. The stream reports matrix travel only, so buffer application cannot be independently verified.

## Run summary

| Run | Requested schedules | Calendar jobs | Optimized | Unassigned | Outside horizon | Result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| S1 | 17486 | 89 | 17 | 31 | 36 | success |
| S2 | 17486, 215, 86 | 107 | 20 | 34 | 46 | success |

Raw output: `captures/260914-2046-S1.txt`, `captures/260914-2046-S2.txt` (local only).

## Sanitized API data response

The following response fields are copied from the terminal `completed` frames and job evidence. Customer names, locations, addresses, coordinates, phone numbers, and tokens are omitted from this committed report.

### S1

```json
{
  "type": "completed",
  "success": true,
  "optimization_id": "opt_sandbox_2c0c25423a5a1c89a1b5260afdf04951",
  "feature_test_log": {
    "schema_version": 12,
    "windows": {
      "horizon_start": "2026-09-14T00:00:00",
      "horizon_end": "2026-09-20T23:59:59",
      "freeze_end": "2026-09-15T00:00:00",
      "placement_start": "2026-09-15T00:00:00",
      "placement_end": "2026-09-21T00:00:00"
    },
    "features": {
      "optimization_horizon": {"value": "7_days"},
      "default_service_hours": {"system_default": true, "start_min": 420, "end_min": 1020},
      "preferred_jobs_per_day": {"value": 8},
      "day_exclusions": {"active": false, "rows": []},
      "technician_skill_matching": {"active": false},
      "region_enforcement": {"active": true, "mode": "strict"},
      "drive_buffer_time": {"active": false, "minutes": 0},
      "route_across_all_tech_schedules": {"active": true},
      "max_jobs_per_day": {"value": 12, "is_hard_cap": true},
      "max_shift_travel_time_limit": {"minutes": 20},
      "arrival_window_duration_override": {"hours": 2}
    },
    "summary": {
      "total_calendar_jobs": 89,
      "routed_count": 17,
      "by_status": {
        "outside_freeze_window": 5,
        "optimized": 17,
        "unassigned": 31,
        "outside_horizon_window": 36
      }
    }
  }
}
```

Relevant S1 job evidence:

```json
{
  "event_id": 206399347,
  "job_id": 206565531,
  "routing_status": "optimized",
  "before": {"start": "2026-09-15T08:59:00+00:00", "schedule_id": 17486},
  "after": {"start": "2026-09-15T08:44:00+00:00", "end": "2026-09-15T09:14:00+00:00", "schedule_id": 17486},
  "after_time_window": {"start": "07:44", "end": "10:14"}
}
```

### S2

```json
{
  "type": "completed",
  "success": true,
  "optimization_id": "opt_sandbox_242d91ee1b9b6ccfe5d4b3bda5f76394",
  "feature_test_log": {
    "schema_version": 12,
    "windows": {
      "horizon_start": "2026-09-14T00:00:00",
      "horizon_end": "2026-09-20T23:59:59",
      "freeze_end": "2026-09-15T00:00:00",
      "placement_start": "2026-09-15T00:00:00",
      "placement_end": "2026-09-21T00:00:00"
    },
    "features": {
      "optimization_horizon": {"value": "7_days"},
      "default_service_hours": {"system_default": true, "start_min": 420, "end_min": 1020},
      "preferred_jobs_per_day": {"value": 8},
      "day_exclusions": {"active": false, "rows": []},
      "technician_skill_matching": {"active": false},
      "region_enforcement": {"active": true, "mode": "strict"},
      "drive_buffer_time": {"active": false, "minutes": 0},
      "route_across_all_tech_schedules": {"active": true}
    },
    "summary": {
      "total_calendar_jobs": 107,
      "routed_count": 20,
      "by_status": {
        "outside_freeze_window": 6,
        "optimized": 20,
        "unassigned": 34,
        "outside_horizon_window": 46,
        "unchanged": 1
      }
    }
  }
}
```

Relevant S2 job evidence:

```json
{
  "event_id": 206268480,
  "job_id": 206434631,
  "routing_status": "optimized",
  "before": {"start": "2026-09-15T08:01:00+00:00"},
  "after": {"start": "2026-09-15T08:01:00+00:00", "end": "2026-09-15T08:31:00+00:00"},
  "after_time_window": {"start": "07:01", "end": "09:31"}
}
```

## Open questions

- A saved settings GET/readback is required before any candidate above can be classified as a confirmed configuration-application bug.
- Arrival Window Duration Override is `OPEN QUESTION`: all optimized jobs use the observed `[start−1h, end+1h]` shape, while the sheet formula expects `[start−1h, start+1h]` with service-hours clamping.
- Status ID `7` is active for Route Around, but no job with status ID `7` appears in either capture.
- Schedule-to-technician identity is missing for schedules `17486` and `9171`.

## Not verifiable from these curls

- Auto-Pilot activation, Live-route mutation, Accept, Undo, Activity Feed, Dashboard metrics, and saved settings persistence.
- Full Max Jobs, Workload Fairness, Preferred Technician, Skill, Region, and travel-buffer behavior without the missing mappings or witnesses.
