# Jobs stream evidence (`feature_test_log`)

Field map of the `autopilot/jobs` stream, verified against the 2026-09 capture in
`test/bug3.md` (`schema_version` 12, 287 jobs). The sheets decide expected behavior;
`verification_hints` and `features.*.note` are API text used only to locate fields.

**Run the extractor first** on every saved capture, passing the checklist caps you have:

```bash
python3 scripts/summarize-jobs-stream.py captures/<file>.txt --max-jobs 12 \
  --max-distance-mi 7 --max-travel-min 20 --restrict 2 --keep week --cross-tech on \
  --max-departure 3:00PM --mode sandbox
```

It prints IDs and numbers only. `[MISMATCH]` = broken invariant (SCHEMA FAIL evidence),
`[FLAG]` = hard-rule candidate, `[UNVERIFIABLE]` = evidence missing, `[NOTE]` = context.
Confirm each line against the references before a verdict; the script does not apply
sheet semantics (soft rules, conflicts, custom rule interpretation).

## Stream frames

| Frame | Content |
|---|---|
| `{"type":"progress","message"}` | Progress text only |
| `{"type":"events","items":[…]}` | Calendar items: `schedule.{id, user_id, primary_id, tech_name}`, `event.{id, start, end, locked, time_window}`, `job.{id, status, status_type, locked}`, `date_label` |
| `{"scope":"optimized","type":"drive_time" \| "downtime","data":[…]}` | Preview series `{job_id, schedule_id, start, end, value, unit:"minutes"}`. Values do not track `jobs[].after` (20/76 drive rows matched) → context, never proof |
| `{"type":"completed","success","message","optimization_id","feature_test_log"}` | Primary evidence. Missing → run `UNVERIFIABLE` |

`feature_test_log` top level: `enabled`, `schema_version`, `windows`, `planning_resolved`,
`features`, `summary`, `performance`, `verification_hints`, `jobs[]`.

## Time encoding

ISO strings carry `+00:00` and `*_unix` fields encode the **same wall clock** as UTC
seconds: recomputing `work_hours.*_inside_hours` from the clock part matched 287/287, and
`time_window.start` equals `start_unix` read as UTC. Use the date and clock parts as
written for day deltas, Sunday–Saturday weeks, months, and cutoffs. If a capture shows
non-zero offsets, re-check before trusting the date math (the script prints a NOTE).

## Config applied vs checklist

| Checklist label | `features.<key>` value fields | `planning_resolved` | Notes |
|---|---|---|---|
| Freeze Window | `freeze_window.days` (`work_day` = Until end of work day, or N) | — | `windows.freeze_end_unix` = today + N (`work_day` → +1) |
| Optimization Window | `optimization_horizon.value` (`14_days`) | — | `windows.horizon_*` spans M days from today |
| Restrict Job Movement | not exposed | — | Config `UNVERIFIABLE`; judge placement |
| Keep Original Period | not exposed | — | Config `UNVERIFIABLE`; judge placement |
| Route Across All Tech Schedules | `route_across_all_tech_schedules.active` | `allow_cross_technician` | |
| Default Service Hours | `default_service_hours.{system_default, start_min, end_min}` | folded into `operating_*_min` | With `system_default=true`, `start_min`/`end_min` are the system default hours |
| Max Jobs per Day | `max_jobs_per_day.{value, is_hard_cap}` | `jobs_per_day`, `max_jobs_is_hard_cap` | Also echoed in `workload_fairness` |
| Preferred Jobs per Day | `preferred_jobs_per_day.value` | `preferred_jobs_per_day` | |
| Pre/Post-Shift Travel Time | `shift_travel_minutes.minutes` | folded into `operating_*_min` | |
| Max Shift End Time | `max_shift_end_time.minutes` | folded into `operating_end_min` | |
| Workload Fairness | `workload_fairness.active` | `workload_balance` | |
| Day Exclusions | `day_exclusions.{active, rows}` | — | `rows=[]` → behavior `UNVERIFIABLE` |
| Minimize Travel Time | `minimize_travel_time.minutes` | `minimize_travel_time_minutes` | |
| Minimize Travel Distance | `minimize_travel_distance.miles` | `minimize_travel_distance_miles` | |
| Maximum Travel Distance | `maximum_travel_distance.{miles, is_hard_cap}` | `max_travel_distance_miles` | |
| Max Shift Travel Time | `max_shift_travel_time_limit.minutes` | `max_shift_travel_time_minutes` | |
| Do Not Reroute Ignore | `do_not_reroute_statuses.statuses` (numeric status IDs) | — | Names ↔ IDs need a mapping, else `UNVERIFIABLE` |
| Do Not Reroute Route Around | `route_around_statuses.statuses` (numeric IDs) | — | Same |
| Preferred Technician Matching | `preferred_technician_matching.mode` | `preferred_tech_matching` | |
| Technician Skill Matching | `technician_skill_matching.active` | `tech_skill_matching` | |
| Max Last Appointment Departure | `max_departure_time.minutes` | folded into `operating_end_min` | Engine end cap, see below |
| Arrival Window Duration Override | `arrival_window_duration_override.hours` | `arrival_window_hours` | |
| Region Enforcement | `region_enforcement.mode` | `region_enforcement` | |
| Customer Scheduling Preferences | `customer_scheduling_preferences.active` | `customer_scheduling_preferences` | |
| Add Drive Buffer Time | `drive_buffer_time.{active, minutes}` | `drive_buffer_min` | |

Keep checklist, saved readback and run-resolved config separate per
`response-reasoning.md`. A mismatch without proof of saved settings is a setup issue,
not product FAIL. A confirmed saved setting ignored in the same run can prove a config
application defect. A key absent from `features` is `UNVERIFIABLE (config)`, never OFF.

**Resolved operating window.** `operating_start_min = service start + pre-shift travel`;
`operating_end_min = min(service end, max shift end, max departure) − post-shift travel`
(verified: 420 + 15 = 435; min(1020, 1080, 900) − 15 = 885). So `work_hours.*_inside_hours`
mixes several rules: judge Service Hours / Max Shift End from the raw `features` values
(script §SERVICE HOURS), and treat the engine's end cap for Max Last Departure as
stricter than the start-based reading — a job it refused for that reason is `OBSERVED`,
never FAIL.

## Windows

| Field | Meaning (verified) |
|---|---|
| `horizon_start_unix` | Today 00:00 |
| `horizon_end_unix` | Today + M − 1, 23:59:59 |
| `freeze_end_unix` | First open day 00:00 (`honor_freeze`) |
| `placement_start_unix` / `placement_end_unix` | Open loaded range: `freeze_end` … `horizon_end + 1 s` |
| `range_start_unix` / `range_end_unix` | Requested calendar range |
| `operating_start_min` / `operating_end_min` | Resolved operating window (above) |

## Job status semantics

| `routing_status` | Verified facts |
|---|---|
| `optimized` | `is_routed=true`; the optimizer placed it, but the placement may equal BEFORE (38/125) — optimized ≠ moved |
| `unchanged` | `routing_status_reason=kept_original_placement`; BEFORE = AFTER; not placed by the optimizer |
| `outside_freeze_window` | BEFORE < `freeze_end`; `locked=true`, `lock_reason=freeze_window`; BEFORE = AFTER; AFTER legs null |
| `unassigned` | `routing_status_reason=solver_unassigned`; `after=null`; the blocking rule is not named |

## Where each check reads

| Check | Fields and method |
|---|---|
| Date gate / Freeze | In Sandbox/Auto-Pilot, use `windows.*`; frozen jobs keep date, time, technician (resolve schedule mapping). A moved job placed before `freeze_end` breaks Freeze. Do not apply Auto-Pilot gate to manual selected dates |
| Window overflow | AFTER beyond `horizon_end_unix` is not FAIL by itself (`routing-rules-logic.md`) |
| Restrict / Keep Original Period | BEFORE vs AFTER date parts: day delta, `week_start = date - ((date.weekday() + 1) % 7 days)` for Sunday–Saturday weeks, month |
| Engine move range | `constraints_applied.move_window.{earliest_unix, latest_unix, feasible_day_labels}` (identical to `customer_scheduling_preferences.move_*`). Moved jobs stayed inside it (80/80); kept placements may sit outside (5) → check only jobs whose placement changed |
| Service Hours / Max Shift End | Raw `features` values (above); `work_hours` per job |
| Max Jobs per Day | Resolve schedule → technician; count distinct event occurrences across all schedules of that technician/date (applicable fixed jobs occupy capacity). Missing/ambiguous mapping, duplicate/missing event identity or incomplete day scope prevents PASS. Pre-existing overload with no optimized stop → `OBSERVED`. `summary.workload_by_schedule` is not per day → never evidence |
| Travel caps | Per schedule + date: Σ `after.distance_m` and Σ `after.drive_sec` — inbound legs, the first from the schedule start address. **Never add `to_next_*`**: stop A's `to_next` leg is stop B's inbound leg (77/77). The stream has no return leg to the end address: over the cap → FAIL (the total is a lower bound); PASS near the cap → say the return leg is missing. Null legs (frozen stops) → lower bound |
| Travel cap attribution | A cap already exceeded by fixed stops (`unchanged`, frozen) is `OBSERVED`; an optimized stop added to that route is FAIL |
| Route order | `after.route_stop_index` 0-based and contiguous; `after.next_job_id` null on the last stop |
| first_stop / last_stop | `route_stop_index == 0` / `next_job_id == null` |
| Cross-Tech identity | Non-zero `events.items[].schedule.user_id` (most are `"0"`) and `feature_signals.preferred_technician_matching.assigned_user_id` for the AFTER schedule. Two schedules can share one user. No mapping → `UNVERIFIABLE` |
| Drive buffer | `feature_signals.drive_buffer_time.{configured_minutes, includes_in_drive_sec, gap_to_next_sec, required_gap_sec, meets_configured_buffer}` (null while the feature is inactive) |
| Arrival window override | `after.time_window` on optimized jobs (`type=fixed`): the window Accept writes. Sheet: `start ± H/2` clamped to Service Hours. Observed 125/125: `[start − H/2, end + H/2]`, unclamped → `OPEN QUESTION` with counts. A window matching neither formula → FAIL. `feature_signals.arrival_window_duration_override.arrival_*` matched 45/125 → never evidence |
| Preferred technician | `feature_signals.preferred_technician_matching.{mode, preferred_tech_ids, preferred_user_id, assigned_schedule_id, assigned_user_id, matched}` |
| Skill matching | `feature_signals.technician_skill_matching.{active, skill_type}`; `solver_input.passes[].required_skill_ids` |
| Region | `feature_signals.region_enforcement.{active, region_label, mode}`; job `region_label` |
| Customer preference | `feature_signals.customer_scheduling_preferences.{location_schedule_rules, matched_preference_windows, move_earliest_unix, move_latest_unix, arrival_window_source}` |
| Ignore / route around | `features.*_statuses.statuses` (IDs) vs job `job_status` (IDs); `constraints_applied.locked` + `lock_reason=route_around` |
| Solver trace | `solver_input.{in_solver_jobs, capacity_reverted, passes[].allowed_vehicle_ids, skip_reason}`; `summary.attempted_solve_day_keys` (`schedule|date`) |
| Location grouping | job `location_id`, `customer_id`, `geo_cluster_id`; `summary.geo_clusters` |

Customer and location names, coordinates, and addresses appear in `jobs[]` and `events`:
use them for analysis only, never copy them into `test/` bug files.

## Self-consistency invariants

These held in the verified capture; contradictory available values are `SCHEMA FAIL`
evidence. Missing fields are `UNVERIFIABLE`; they do not stop independent rule checks.
The extractor flags candidates; confirm mode, identities and field completeness:

1. `len(jobs) == summary.total_calendar_jobs == Σ summary.by_status`, and `by_status`
   equals the `routing_status` counts.
2. `summary.routed_count == count(is_routed) == by_status.optimized`;
   `routed_count + not_routed_count == total_calendar_jobs`.
3. `summary.outside_operating_hours_{before,after}_count == count(work_hours.*_inside_hours = false)`,
   and each flag equals the wall-clock recompute.
4. `summary.travel.after_total_drive_sec == Σ after.drive_sec`;
   `after_total_distance_m == Σ after.distance_m`.
5. Status semantics in §Job status semantics (unassigned has no AFTER; unchanged and
   frozen jobs keep placement; frozen jobs carry the freeze lock; every job before
   `freeze_end` is frozen; `is_routed` ⇔ `optimized`).
6. Per schedule + date: `route_stop_index` = 0 … n−1; stop A `next_job_id` = stop B
   `job_id` and A `to_next_*` = B inbound legs; the last stop has no `next_job_id`.
7. In Sandbox/Auto-Pilot only, `windows`: `freeze_end` = today + Freeze days; horizon spans M days from today;
   `placement_start = freeze_end`; `placement_end = horizon_end + 1 s`.

**Not invariants — never SCHEMA FAIL on them:** `summary.workload_by_schedule`,
`drive_time` / `downtime` frames, `arrival_*` signal fields, `move_window` for kept
placements, raw `locked` counts vs `custom_rule_signal_counts.locked` (freeze locks are
excluded from the signal), and before-travel totals of 0 (before legs are not measured,
so savings are `UNVERIFIABLE`).

## Custom rules evidence

Always check custom rule signals — whether the checklist supplies rules, says `none`, or
omits the block.

| Field | Primitive it proves |
|---|---|
| `summary.custom_rule_signal_counts.{locked, forced_tech, preferred_tech, hard_arrival_window, soft_arrival_window, position_first, position_last, conflict}` | Jobs touched per custom primitive in the run |
| `constraints_applied.locked` + `lock_reason` | `lock` only when `lock_reason` is not `freeze_window` (Freeze) or `route_around` (status route-around) |
| `constraints_applied.forced_user_id` + `forced_rule_id` | `force_tech`; AFTER `assigned_user_id` must equal it |
| `constraints_applied.preferred_user_id` + `preferred_rule_id` + `preferred_weight` | `prefer_tech` |
| `constraints_applied.position_constraint` + `position_rule_id` | `first_stop` / `last_stop` |
| `constraints_applied.hard_arrival_window` / `soft_arrival_window` | strict / soft `time_window` (`arrival_window_source=custom_rule_hard` for strict) |
| `constraints_applied.move_window` | `movement_limit` / `keep_period` together with Restrict |
| `constraints_applied.conflict_rule_ids` | Rule-level conflict |
| `constraints_applied.custom_rule_soft` | Soft custom rules applied to the job |
| `custom_rules` array (absent in the 2026-09 captures; use when present) | Rules the engine loaded |

Checks:

1. **Supplied rule mapped to a primitive** with in-scope jobs inside the gate → the
   matching count and per-job `*_rule_id` / flag must be set. All zero → `FAIL` (custom
   rule not applied), unless every in-scope job is frozen, out of gate, or excluded.
2. **`Custom rules: none`** → every count is 0, every `*_rule_id` is null,
   `conflict_rule_ids` and `custom_rule_soft` are empty, and no custom `lock` exists.
   Anything else → `FAIL` (unexpected custom rule attribution). Freeze and route-around
   locks do not count.
3. **Block omitted** → list non-zero signals as `OBSERVED`; no verdict.
4. **Unmapped assertion** (e.g. same-location grouping) has no dedicated signal → verify
   placement from BEFORE / AFTER + `location_id`; attribution is `UNVERIFIABLE` unless
   `custom_rule_soft` or a `custom_rules` array identifies the rule.
5. **`conflict_rule_ids` non-empty** → must match a sheet conflict pair among the
   supplied rules; an unexplained conflict → `FAIL`; an expected conflict with no ids →
   report per `custom-rules-dynamic.md`.
6. **`custom_rules` array present** → compare count, title/text, and status with the
   supplied block. Differences require the config provenance check in
   `response-reasoning.md`; do not turn an unverified saved configuration into a bug.

## API hints that touch open questions

Record as `OBSERVED`, never as a resolution of the sheet question:

- Max travel hint expects unassigned stops beyond a depot radius (sheet contradiction:
  total per shift vs radius).
- Arrival window override note says Accept rewrites `job_event.time_window` and is not a
  solver arrival clip; the observed width `[start − H/2, end + H/2]` differs from the
  sheet formula.
- `max_departure_time` note: the cutoff caps `operating_end_min` (end-based), stricter
  than the start-based reading in `mantis-rule-logic.md` #16.
