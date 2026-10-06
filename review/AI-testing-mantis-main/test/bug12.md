# Mantis Autopilot Routing Audit — 100-Case Run

## Test setup

Run: `260915-1100`  
Endpoint: `GET /api/routing/mantis/autopilot/jobs`  
Mode: Auto-Pilot jobs stream with `agenda3Weeks` and `inc=recurring`  
Requests: 100 unique read-only GET cases  
Transport: 100/100 HTTP 200 with terminal `completed`; 2 cases required retry

Checklist used for every case:

| Category | Rule | Requested value |
| --- | --- | --- |
| Routing Rules | Freeze Window | 4 days |
| Routing Rules | Auto-Pilot Optimization Window | 14 days |
| Routing Rules | Restrict Job Movement | ±3 days |
| Routing Rules | Keep Original Period | Week |
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
| 1 | Freeze Window | `freeze_window.days=4`; no frozen placement changed | ✅ **PASS** |
| 2 | Auto-Pilot Optimization Window | `optimization_horizon.value=14_days` | ✅ **PASS** |
| 3 | Restrict Job Movement ±3 days | 38 optimized placements in 29 cases moved 4 days | ❌ **FAIL** |
| 4 | Keep Original Period = Week | 104 optimized placements in 41 cases crossed Sunday–Saturday weeks | ❌ **FAIL** |
| 5 | Route Across All Tech Schedules | `route_across_all_tech_schedules.active=true` | ✅ **PASS** config; behavior has no technician-change witness |
| 6 | Default Service Hours | System default resolves to 07:00–17:00 (`start_min=420`, `end_min=1020`) | ⚠️ **CANDIDATE** |
| 7 | Max Jobs per Day = 6 | `max_jobs_per_day.value=6`, hard cap enabled; no in-scope optimized route exceeded 6 | ✅ **PASS** |
| 8 | Preferred Jobs per Day = 10 | `preferred_jobs_per_day.value=8` | ⚠️ **CANDIDATE** |
| 9 | Pre/Post-Shift Travel Time | `shift_travel_minutes.minutes=15` | ✅ **PASS** |
| 10 | Max Shift End Time | `max_shift_end_time.minutes=1080` | ✅ **PASS** |
| 11 | Workload Fairness | `workload_fairness.active=true` | ✅ **PASS** config |
| 12 | Day Exclusions | `active=false`, `rows=[]` | ⚠️ **CANDIDATE** |
| 13 | Minimize Travel Time | `minimize_travel_time.minutes=5` | ✅ **PASS** config |
| 14 | Minimize Travel Distance | `minimize_travel_distance.miles=3` | ⚠️ **CANDIDATE** |
| 15 | Maximum Travel Distance | No optimized route exceeded 7 miles; return leg is not in the stream | ✅ **PASS** lower-bound check |
| 16 | Max Shift Travel Time | No optimized route exceeded 20 minutes; return leg is not in the stream | ✅ **PASS** lower-bound check |
| 17 | Do Not Reroute / Ignore | API exposes numeric status IDs; mapping for Completed/Cancelled was not supplied | ⚠️ **UNVERIFIABLE** |
| 18 | Do Not Reroute / Route Around | API exposes active status ID 7; mapping to In Progress was not supplied; locked jobs stayed unchanged | ⚠️ **UNVERIFIABLE** |
| 19 | Preferred Technician Matching = Strict | `preferred_technician_matching.mode=strict`; no eligible preference witness | ⚠️ **UNVERIFIABLE** behavior |
| 20 | Technician Skill Matching | `technician_skill_matching.active=false` | ⚠️ **CANDIDATE** |
| 21 | Max Last Appointment Departure | `max_departure_time.minutes=900`; after-cutoff examples were pre-existing, with no optimized witness | ⚠️ **OBSERVED** |
| 22 | Arrival Window Duration Override | `arrival_window_duration_override.hours=2`; display formula needs a dedicated eligible witness | ⚠️ **UNVERIFIABLE** behavior |
| 23 | Region Enforcement = Soft | `region_enforcement.mode=strict` | ⚠️ **CANDIDATE** |
| 24 | Customer Scheduling Preferences | `customer_scheduling_preferences.active=true`; no eligible preference row in the tested placements | ⚠️ **UNVERIFIABLE** behavior |
| 25 | Add Drive Buffer Time | `drive_buffer_time.active=false`, 0 min | ⚠️ **CANDIDATE** |

Configuration candidates require a saved-settings GET/readback before promotion to confirmed configuration-application bugs. The two placement FAILs are based on independent BEFORE/AFTER date calculations and do not depend on the unresolved settings readback.

## ❌ FAILED CASES

### ❌ **FAIL — Restrict Job Movement = ±3 days**

Failed cases: `41–50`, `72–80`, `91–100`  
Total: 38 optimized placements across 29 cases; maximum movement: +4 days

Representative failures:

```text
❌ FAILED — Case 41
Job 206588403 / event 206422219
Before: 2026-09-24, schedule 19984
After:  2026-09-28, schedule 19984
Movement: +4 days

❌ FAILED — Case 42
Job 206578845 / event 206412661
Before: 2026-09-22, schedule 19984
After:  2026-09-26, schedule 19984
Movement: +4 days

❌ FAILED — Case 72
Job 206497189 / event 206331005
Before: 2026-09-23, schedule 9171
After:  2026-09-27, schedule 9171
Movement: +4 days
```

Expected: every movable optimized job satisfies `|AFTER date − BASELINE date| ≤ 3 days`.  
Actual: the listed optimized placements moved 4 days.  
Rule source: Routing Rules logic, `Restrict Job Movement`; Sheet C Routing Rules case `#6`.

### ❌ **FAIL — Keep Original Period = Week**

Failed cases: `31–41`, `71–100`  
Total: 104 optimized placements across 41 cases; 11 unique jobs

Representative failures:

```text
❌ FAILED — Case 31
Job 206491009 / event 206324825
Before: 2026-09-24, inside Sunday–Saturday week 2026-09-20–2026-09-26
After:  2026-09-27, inside Sunday–Saturday week 2026-09-27–2026-10-03

❌ FAILED — Case 72
Job 206497189 / event 206331005
Before: 2026-09-23, inside Sunday–Saturday week 2026-09-20–2026-09-26
After:  2026-09-27, inside Sunday–Saturday week 2026-09-27–2026-10-03
```

Expected: every movable optimized job remains in the same Sunday–Saturday week as its baseline date.  
Actual: the optimized placements crossed into the next Sunday–Saturday week.  
Sunday-boundary validation: a move such as 2026-09-24 → 2026-09-27 changes the week from 2026-09-20–2026-09-26 to 2026-09-27–2026-10-03. Some of these dates share ISO week 39, but ISO week numbering is not the rule under test; the product rule is Sunday–Saturday. These are valid FAILs caused by crossing Sunday.
Rule source: Routing Rules logic, `Keep Original Period — Week`; Sheet C Routing Rules case `#7`.

## Test combinations

Each of the 100 cases evaluated the complete checklist above. The compound checks were:

| Combination | Rules evaluated together |
| --- | --- |
| C01 | Freeze Window 4 days + Optimization Window 14 days |
| C02 | Freeze + Restrict Movement ±3 + Keep Original Period Week |
| C03 | Route Across All Tech Schedules ON + Preferred Technician Strict + Skill Matching ON |
| C04 | Default Service Hours + Pre/Post-Shift Travel 15 min + Max Shift End 6:00 PM + Last Departure 3:00 PM |
| C05 | Max Jobs/day 6 + Preferred Jobs/day 10 + Workload Fairness ON |
| C06 | Minimize Travel Time 5 min + Minimize Travel Distance 0.5 miles + Maximum Travel Distance 7 miles + Max Shift Travel 20 min + Drive Buffer 10 min |
| C07 | Freeze + Day Exclusions Tech A Monday + Max Jobs/day 6 |
| C08 | Ignore Completed/Cancelled + Route Around In Progress |
| C09 | Customer Scheduling Preferences ON + Arrival Window Override 2 hours + Region Enforcement Soft |
| C10 | All supplied rules evaluated together on every completed stream |

The 10 schedule combinations were:

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
| 9 | `17486,215,86` |
| 10 | `1004,15012,19984,9171` |

Each schedule combination was tested against all 10 date windows below, producing 100 unique curl cases:

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

## Run summary

| Metric | Result |
| --- | ---: |
| Unique curl cases | 100 |
| HTTP 200 | 100 |
| Terminal completed streams | 100 |
| Cases retried | 2 |
| Schema mismatches | 0 |
| Total jobs | 5,682 |
| Optimized jobs | 816 |
| Unassigned jobs | 2,553 |
| Outside freeze jobs | 986 |
| Outside horizon jobs | 1,262 |
| Unchanged jobs | 65 |
| Freeze violations | 0 |
| Movement violations over ±3 | 38 |
| Week crossings | 104 |
| In-scope Max Jobs/day violations | 0 |
| Optimized travel cap overages | 0 |

`outside_freeze_window`, `outside_horizon_window`, and `unassigned` are not bugs by themselves. Pre-existing jobs outside the service-hour or departure cutoff are reported as `OBSERVED` when no optimized placement caused the condition.

## Retained evidence

Only representative problem/configuration captures and the complete manifest are retained:

- `captures/260915-1100-S031.txt` — Week failure and resolved configuration
- `captures/260915-1100-S041.txt` — Movement failure
- `captures/260915-1100-S042.txt` — Movement failure
- `captures/260915-1100-S072.txt` — Movement and week failures
- `captures/260915-1100-S091.txt` — Movement failure in the multi-schedule combination
- `captures/260915-1100-100-curl-manifest.tsv` — case-to-schedule/date mapping

The committed report contains no token, customer name, address, phone number, or coordinate.

## Open questions

- Confirm saved settings with a settings GET/readback before promoting the seven configuration candidates.
- Supply the numeric status mapping for Completed, Cancelled, and In Progress to complete Ignore/Route Around verification.
- Supply eligible preference, skill, region, and technician-identity witnesses for behavioral verification of those rules.
