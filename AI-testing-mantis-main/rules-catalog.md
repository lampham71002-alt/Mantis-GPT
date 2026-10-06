# Mantis Rules Catalog — 31 fields/actions

Every routing rule Mantis knows about, with its **hard/soft class**, the **exact API
payload key**, the FE default, and the value the QA corpus uses.

Envelope convention for System Rules: every field is `{ status: 0|1, value: <x> }`.
`status: 0` = rule OFF (system default applies). Three fields are bare `0|1` flags with
no `value`: `workload_balance`, `tech_skill_matching`, `customer_scheduling_preferences`.

Time values are **minutes from midnight** (8:30 AM = 510, 6:00 PM = 1080).

---

## WB — Workforce Boundaries (`workforce_boundaries`)

`PUT v1/routing/workforce-boundaries` · FE: `src/app/modules/mantis/settings/systemRules/WorkforceBoundaries.js`

| # | Field | Class | API key | FE default | QA value | Behaviour |
|---|-------|-------|---------|-----------|----------|-----------|
| 1 | Default Service Hours | **Hard** | `default_service_hours` → `{ system_default: 0\|1, start, end }` | 480–1080 (8AM–6PM) | 8:30AM–6PM (510–1080) | Jobs may only be ranked inside the window; anything outside is ignored |
| 2 | Max Jobs per day | **Hard**\* | `max_jobs_per_day` | 8 | 15 | Cap of jobs/day/tech. \*Product later ruled this **soft** — see SKILL.md |
| 3 | Preferred Jobs per day | Soft | `preferred_jobs_per_day` | 6 | 10 | Target only; Max Jobs is the real ceiling |
| 4 | Pre/Post-Shift Travel Time | **Hard** | `shift_travel_minutes` | 15 | 30 | Travel outside the shift. Shrinks the effective window: `[start+N, end−N]` |
| 5 | Max Shift End Time | **Hard** | `max_shift_end_time` (minutes) | — | 6:00PM (1080) | Absolute stop. Outranks Service Hours |
| 6 | Workload Fairness | Soft | `workload_balance` (bare `0\|1`) | — | ON | Even spread of hours + travel across techs |
| 7 | Day Exclusions | **Hard** | `day_exclusions` → `[{ day_of_week, technician_ids }]` | — | Tech A off Monday | Tech takes no jobs that weekday; work redistributes |

Also present in the payload: `overtime_protection_enabled` (`{ status, value }`, default `{1,true}`) — not one of the 31.

**Effective daily window** = `[service_hours.start + shift_travel, min(service_hours.end, max_shift_end_time) − shift_travel]`.

---

## RE — Route Efficiency (`route_efficiency`)

`PUT v1/routing/route-efficiency` · FE: `src/app/modules/mantis/settings/systemRules/RouteEfficiency.js`

| # | Field | Class | API key | FE default | QA value | Behaviour |
|---|-------|-------|---------|-----------|----------|-----------|
| 1 | Minimize Travel Time | Soft | `minimize_travel_time_minutes` | 5 | 5 min | Objective, never a stop condition |
| 2 | Minimize Travel Distance | Soft | `minimize_travel_distance_miles` | 3 | 0.5 mi | Objective, never a stop condition |
| 3 | Maximum Travel Distance | **Hard** | `max_travel_distance_miles` | 100 | 10 mi | Cap on **total travel per shift** |
| 4 | Max Shift Travel Time Limit | **Hard** | `max_shift_travel_time_minutes` | 120 | 120 min | Cap on **total travel time per shift** |
| 5 | Do not reroute — **ignore** statuses | **Hard** | `do_not_reroute_statuses` → `[statusId]` | — | ON | Job is skipped; **its slot may be reused** by another job |
| 6 | Do not reroute — **route around** statuses | **Hard** | `route_around_statuses` → `[statusId]` | — | ON | Job is skipped and **its slot is blocked** |
| 7 | Preferred Technician Matching | Soft **or** Strict | `preferred_tech_matching` → `'soft'\|'strict'` | — | both | Soft = best-effort with fallback; Strict = **no fallback**, job goes unassigned |
| 8 | Technician Skill Matching | **Hard** | `tech_skill_matching` (bare `0\|1`) | — | ON | Service type must match tech skill |

`ignore` vs `route around` is the pair testers get wrong most often: both skip the job,
only `route around` reserves its time slot.

---

## SC — Service Commitments (`service_commitments`)

`PUT v1/routing/service-commitment` · FE: `src/app/modules/mantis/settings/systemRules/ServiceCommitments.js`

| # | Field | Class | API key | FE default | QA value | Behaviour |
|---|-------|-------|---------|-----------|----------|-----------|
| 1 | Max Last Appointment Departure Time | **Hard** | `max_departure_time` (minutes) | — | 4:00PM (960) | Strict cutoff — nothing may end after it |
| 2 | Arrival Window Duration Override | **Hard** (display) | `arrival_window_hours` | 2 | 2 h | Replaces legacy Time Window. Job at 1PM shows 12PM–2PM |
| 3 | Region Enforcement | Soft **or** Strict | `region_enforcement` → `'soft'\|'strict'` | — | both | Soft = deprioritize out-of-region; Strict = **block** |
| 4 | Customer Scheduling Preferences | Soft | `customer_scheduling_preferences` (bare `0\|1`) | — | ON | Honour the customer's preference where possible |
| 5 | Add Drive Buffer Time | **Hard** | `drive_buffer` (minutes) | 5 | 10 min | Added **on top of** actual drive time (4 min drive + 10 buffer = 14) |

---

## CR — Custom Rules (11 actions)

Authored through the Mantis chat rule-setter, stored under
`v1/routing/mantis/custom-rules`. Not FE constants — the action names below are the
rule DSL used by the backend and by the QA corpus.

| # | Action | Class | Argument | Behaviour |
|---|--------|-------|----------|-----------|
| 1 | `keep_period` | **Hard** | `week` \| `month` | Job stays inside its original week/month |
| 2 | `force_tech` | **Hard** | `tech_id` | Mandatory assignment. Overrides Preferred Tech (RE) and Workload Fairness (WB) |
| 3 | `prefer_tech` | Soft | `$stop.preferred` | Prioritize the tech if available |
| 4 | `movement_limit` | **Hard** | `max_days: N` | Job may shift at most N days |
| 5 | `time_window` (strict) | **Hard** | `HH:MM-HH:MM` | Must arrive inside the window |
| 6 | `time_window` (soft) | Soft | `HH:MM-HH:MM` | Prefer the window |
| 7 | `arrival_window_duration` | Display | seconds (3600 = ±30 min) | Customer notification window only — **no routing effect** |
| 8 | `first_stop` | **Hard** | — | First job of the day |
| 9 | `last_stop` | **Hard** | — | Last job of the day |
| 10 | `lock` | **Hard** | — | Job frozen in place; autopilot routes around it |
| 11 | `exclude` | **Hard** | — | Job removed from routing entirely — **overrides every other rule** |

Rule matching semantics (from the CR edge cases):
- `match: all` — the stop must satisfy **every** filter field; 2 of 3 → rule does not apply.
- `match: any` — 1 of 3 matching fields is enough → rule applies.
- `preferred_tech: *` with `stop.preferred_tech_id = null` → rule does **not** apply.
- `status: inactive` → the rule is ignored completely.

---

## Routing Rules (`routing_rules`) — gatekeeper, not one of the 31

`PUT v1/routing/system-rules` · FE: `src/app/modules/mantis/settings/systemRules/RoutingRules.js`

| Field | API key | Notes |
|-------|---------|-------|
| Auto-Pilot Run Frequency | `auto_optimization` → `{ frequency: daily\|weekly\|monthly, run_at_minutes }` | Must always be ON. Default **daily at 12:00 AM** |
| Freeze Window | `freeze_window_days` → `'work_day'` \| N (the API returns `work_day`, not `end_of_day`) | Must always be ON. Default **Until End of Work Day**. Frozen days are untouchable |
| Optimization Horizon | `optimization_horizon` → `current_week\|next_week\|this_month\|next_month\|7_days\|14_days\|30_days\|45_days\|60_days` | Upper bound of the optimization range |
| Restrict Job Movement | `job_movement_restriction_days` | OFF ⇒ **no** restriction (any date in range), not "same day" |
| Keep Original Period | `preserve_original_period` → `week\|month` | System-level twin of CR `keep_period` |
| Route Across All Techs | `allow_cross_technician_routing` (bare `0\|1`) | Allows reassignment between techs |

Selectable freeze values: `end_of_day, 2, 3, 4, 5, 6, 7, 10, 14, 30, 45, 60` days
(`HEALTH_WINDOW_OPTIONS` in `settings/systemRules/constants.js`).

## Routing triggers (`v1/routing/triggers`)

`job_added`, `job_moved`, `job_canceled`, `job_terminated`, `job_rescheduled`,
`job_batch_move`, `job_batch_reassign`, `timeoff_added`, `custom_event_added`,
`booking_unconfirmed`. Each history entry in Activity Feed is stamped with the
trigger that initiated it.
