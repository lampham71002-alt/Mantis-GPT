# Mantis Autopilot Routing Audit — 100-Case Run

## Test setup

Run: `260915-1142`  
Endpoint: `GET /api/routing/mantis/autopilot/jobs`  
Mode: Auto-Pilot jobs stream with `agenda3Weeks` and `inc=recurring`  
Requests: 100 unique read-only GET cases  
Transport: 100/100 HTTP 200 with terminal `completed`; no retry was needed

Checklist used for every case:

| Category | Rule | Requested value |
| --- | --- | --- |
| Routing Rules | Freeze Window | 2 days |
| Routing Rules | Auto-Pilot Optimization Window | 14 days |
| Routing Rules | Restrict Job Movement | ±3 days |
| Routing Rules | Keep Original Period | Month |
| Routing Rules | Route Across All Tech Schedules | ON |
| Workforce Boundaries | Default Service Hours | 8:30 AM–6:00 PM |
| Workforce Boundaries | Max Jobs per Day | 6 |
| Workforce Boundaries | Preferred Jobs per Day | 10 |
| Workforce Boundaries | Pre/Post-Shift Travel Time | 15 min |
| Workforce Boundaries | Max Shift End Time | 6:00 PM |
| Workforce Boundaries | Workload Fairness | ON |
| Workforce Boundaries | Day Exclusions | Tech A = Monday |
| Route Efficiency | Minimize Travel Time | 5 min |
| Route Efficiency | Minimize Travel Distance | 0.5 miles |
| Route Efficiency | Maximum Travel Distance | 7 miles |
| Route Efficiency | Max Shift Travel Time | 20 min |
| Route Efficiency | Do Not Reroute / Ignore | Completed, Cancelled |
| Route Efficiency | Do Not Reroute / Route Around | In Progress |
| Route Efficiency | Preferred Technician Matching | Strict |
| Route Efficiency | Technician Skill Matching | ON |
| Service Commitments | Max Last Appointment Departure | 3:00 PM |
| Service Commitments | Arrival Window Duration Override | 2 hours |
| Service Commitments | Region Enforcement | Soft |
| Service Commitments | Customer Scheduling Preferences | ON |
| Service Commitments | Add Drive Buffer Time | 10 min |

## Tested rules and verdicts

| # | Rule | Run-resolved value / evidence | Verdict |
| ---: | --- | --- | --- |
| 1 | Freeze Window | `freeze_window.days=2`; `freeze_end=2026-09-17`; no frozen placement changed | ✅ **PASS** |
| 2 | Auto-Pilot Optimization Window | `optimization_horizon.value=14_days` | ✅ **PASS** |
| 3 | Restrict Job Movement ±3 days | 176 optimized placements in 47 cases moved 4–6 days | ❌ **FAIL** |
| 4 | Keep Original Period = Month | 0 optimized placements crossed a calendar month | ✅ **PASS** |
| 5 | Route Across All Tech Schedules | `route_across_all_tech_schedules.active=true`; schedule changes observed in eligible placements | ✅ **PASS** config |
| 6 | Default Service Hours | Response resolves to system default 7:00 AM–5:00 PM | ⚠️ **CANDIDATE** |
| 7 | Max Jobs per Day = 6 | Hard cap is enabled; technician mapping is missing for several schedules, so full per-tech validation is unavailable | ⚠️ **UNVERIFIABLE** |
| 8 | Preferred Jobs per Day = 10 | Response reports `preferred_jobs_per_day.value=8`; resolver reports 6 | ⚠️ **CANDIDATE** |
| 9 | Pre/Post-Shift Travel Time | `shift_travel_minutes.minutes=15` | ✅ **PASS** |
| 10 | Max Shift End Time | `max_shift_end_time.minutes=1080` | ✅ **PASS** |
| 11 | Workload Fairness | `workload_fairness.active=true` | ✅ **PASS** config |
| 12 | Day Exclusions | `active=false`, `rows=[]` | ⚠️ **CANDIDATE** |
| 13 | Minimize Travel Time | `minimize_travel_time.minutes=5` | ✅ **PASS** config |
| 14 | Minimize Travel Distance | Response reports 3 miles instead of requested 0.5 miles | ⚠️ **CANDIDATE** |
| 15 | Maximum Travel Distance | No optimized route exceeded 7 miles; return leg is absent from the stream | ✅ **PASS** lower-bound check |
| 16 | Max Shift Travel Time | No optimized route exceeded 20 minutes; return leg is absent from the stream | ✅ **PASS** lower-bound check |
| 17 | Do Not Reroute / Ignore | Numeric status IDs are exposed; Completed/Cancelled mapping is not supplied | ⚠️ **UNVERIFIABLE** |
| 18 | Do Not Reroute / Route Around | Numeric status IDs are exposed; In Progress mapping is not supplied | ⚠️ **UNVERIFIABLE** |
| 19 | Preferred Technician Matching = Strict | `preferred_technician_matching.mode=strict`; no eligible preference witness | ⚠️ **UNVERIFIABLE** behavior |
| 20 | Technician Skill Matching | `technician_skill_matching.active=false` | ⚠️ **CANDIDATE** |
| 21 | Max Last Appointment Departure | `max_departure_time.minutes=900`; flagged late starts were pre-existing and had no optimized stop | ⚠️ **OBSERVED** |
| 22 | Arrival Window Duration Override | `arrival_window_duration_override.hours=2`; dedicated eligible behavior witness is absent | ⚠️ **UNVERIFIABLE** behavior |
| 23 | Region Enforcement = Soft | Response reports `region_enforcement.mode=strict` | ⚠️ **CANDIDATE** |
| 24 | Customer Scheduling Preferences | `customer_scheduling_preferences.active=true`; no eligible preference row | ⚠️ **UNVERIFIABLE** behavior |
| 25 | Add Drive Buffer Time | Response reports `drive_buffer_time.active=false`, 0 min | ⚠️ **CANDIDATE** |

Configuration candidates require a saved-settings GET/readback before promotion to confirmed configuration-application bugs. The Restrict Job Movement FAIL is based on independent BEFORE/AFTER date calculations from completed optimization streams.

## ❌ **FAIL — Restrict Job Movement = ±3 days**

Failed cases: `31–39`, `41–50`, `72–89`, `91–100`  
Total: 176 optimized placements across 47 cases; 12 unique jobs; maximum movement: +6 days

Representative failures:

```text
❌ FAILED — Case 31
Job 206483108 / event 206316924
Before: 2026-09-18T11:40:00+00:00, schedule 17486
After:  2026-09-24T07:15:00+00:00, schedule 17486
Movement: +6 days

❌ FAILED — Case 41
Job 206588403 / event 206422219
Before: 2026-09-24T11:42:00+00:00, schedule 19984
After:  2026-09-28T09:47:32+00:00, schedule 19984
Movement: +4 days

❌ FAILED — Case 72
Job 206497189 / event 206331005
Before: 2026-09-23T11:45:00+00:00, schedule 9171
After:  2026-09-27T07:35:00+00:00, schedule 9171
Movement: +4 days
```

Expected: every movable optimized job satisfies `|AFTER date − BASELINE date| ≤ 3 days`.  
Actual: the listed optimized placements moved 4–6 days.  
Freeze check: all representative placements are after the 2026-09-17 freeze boundary.  
Rule source: Routing Rules logic, `Restrict Job Movement`; Sheet C Routing Rules case `#6`.

## Test combinations

Each of the 100 cases evaluated the complete checklist above. The compound checks were:

| Combination | Rules evaluated together |
| --- | --- |
| C01 | Freeze Window 2 days + Optimization Window 14 days |
| C02 | Freeze + Restrict Movement ±3 + Keep Original Period Month |
| C03 | Route Across All Tech Schedules ON + Preferred Technician Strict + Skill Matching ON |
| C04 | Default Service Hours + Pre/Post-Shift Travel 15 min + Max Shift End 6:00 PM + Last Departure 3:00 PM |
| C05 | Max Jobs/day 6 + Preferred Jobs/day 10 + Workload Fairness ON |
| C06 | Minimize Travel Time 5 min + Minimize Travel Distance 0.5 miles + Maximum Travel Distance 7 miles + Max Shift Travel 20 min + Drive Buffer 10 min |
| C07 | Ignore Completed/Cancelled + Route Around In Progress + Freeze Window 2 days |
| C08 | Keep Original Period Month + Restrict Movement ±3 + Optimization Window 14 days |
| C09 | Arrival Window Override 2 hours + Service Hours + Max Last Appointment Departure 3:00 PM |
| C10 | Region Soft + Customer Scheduling Preferences ON + Route Across All Tech Schedules ON |

Schedule combinations:

| Schedule set | Schedule IDs | Cases |
| ---: | --- | ---: |
| S01 | `1004` | 1–10 |
| S02 | `15012` | 11–20 |
| S03 | `16023` | 21–30 |
| S04 | `17486` | 31–40 |
| S05 | `19984` | 41–50 |
| S06 | `215` | 51–60 |
| S07 | `86` | 61–70 |
| S08 | `9171` | 71–80 |
| S09 | `17486,215,86` | 81–90 |
| S10 | `1004,15012,19984,9171` | 91–100 |

Date windows:

| Window | Start | End |
| ---: | --- | --- |
| W01 | 2026-09-15 | 2026-09-22 |
| W02 | 2026-09-15 | 2026-09-29 |
| W03 | 2026-09-15 | 2026-10-06 |
| W04 | 2026-09-16 | 2026-09-29 |
| W05 | 2026-09-17 | 2026-09-30 |
| W06 | 2026-09-18 | 2026-10-01 |
| W07 | 2026-09-19 | 2026-10-02 |
| W08 | 2026-09-20 | 2026-10-03 |
| W09 | 2026-09-21 | 2026-10-04 |
| W10 | 2026-09-22 | 2026-10-05 |

The 100 cases are the Cartesian product `S01–S10 × W01–W10`; case order is each schedule set across W01–W10.

## Run summary

| Metric | Result |
| --- | ---: |
| HTTP 200 / terminal completed | 100 / 100 |
| Calendar jobs in streams | 6,021 |
| Optimized placements | 1,270 |
| Unassigned jobs | 3,050 |
| Outside freeze window | 366 |
| Outside optimization horizon | 1,262 |
| Unchanged jobs | 73 |
| Schema mismatches | 0 |
| Freeze placement violations | 0 |
| Keep Month crossings | 0 |
| Restrict Movement violations | 176 |

Representative raw output retained locally: `captures/260915-1142-S031.txt`, `captures/260915-1142-S041.txt`, `captures/260915-1142-S072.txt`, `captures/260915-1142-S088.txt`, `captures/260915-1142-S100.txt`, together with the full request manifest `captures/260915-1142-100-curl-manifest.tsv`.

## Open questions

- Technician mapping is absent or ambiguous for several schedule IDs, so full per-technician Max Jobs/day validation remains UNVERIFIABLE.
- The API stream does not expose a saved-settings readback for the requested values that differ from response-resolved values.
