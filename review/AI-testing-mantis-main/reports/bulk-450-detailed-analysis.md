# Mantis Routing Bulk 450 API Verification — Detailed Analysis

Generated: `2026-08-22T17:31:14`

## Executive summary

| Metric | Value |
|---|---:|
| Scenarios in bulk suite | 450 |
| Results present | 450 |
| Optimize streams captured | 292 |
| Config/API rejected before optimize | 158 |
| Estimated API calls | 3258–3644 |
| Successful captures with requested config read back correctly | 28 |
| Successful captures with setup mismatch / unknown ignored fields | 264 |
| Successful captures with actual job placement changes | 0 |
| Captures with core metric changed vs control | 3 |

**Bottom line:** the run did exercise >3k API calls and produced raw evidence, but it does **not** prove most System Rule correctness yet. The dominant blocker is response/setup quality: many generated rule payload fields used non-contract names or wrong value shapes, and every successful optimize stream returned `jobs_optimized` with the same placement as `jobs_before` (`jobs_moved=0`). That prevents proving whether the optimizer placed jobs correctly under hard rules.

## APIs actually exercised

### Bulk 450
- `PUT /routing/system-rules` — restore before every scenario; scenario setup when present
- `PUT /routing/workforce-boundaries` — restore before every scenario; scenario setup when present
- `PUT /routing/route-efficiency` — restore before every scenario; scenario setup when present
- `PUT /routing/service-commitment` — restore before every scenario; scenario setup when present
- `GET /routing/<rule-endpoint>` — read-back into `config-applied.json` for successful setup endpoints
- `PUT /routing/mantis/manual/optimize` — raw NDJSON captured for successful scenarios

### Sandbox / feeds batch already captured
- `GET /routing/mantis/autopilot/jobs`
- `GET /routing/mantis/autopilot/routes`
- `PUT /routing/mantis/manual/optimize`
- `GET /routing/mantis/feeds/history`
- `GET /routing/mantis/feeds/errors`
- `GET /routing/mantis/feeds/errors/count`
- `GET /routing/mantis/feeds/history/:id/logs`

## Response contract findings

| Check | Count | Interpretation |
|---|---:|---|
| `jobs_optimized_identical_to_before` | 292 / 292 | Blocks placement assertions |
| `zero_moved_jobs` | 292 / 292 | Blocks placement assertions |
| `stats_after_work_mismatch` | 292 / 292 | Internal response inconsistency |
| `stats_drive_mismatch_raw_segments` | 292 / 292 | Internal response inconsistency |
| `stats_jobs_assigned_mismatch_count` | 0 / 292 | Internal response inconsistency |

### What this means for optimized jobs

`jobs_moved` is **not** a field returned by the API. It is a derived audit metric computed by comparing every job in the raw `jobs` chunks: `scope=before` vs `scope=optimized`, keyed by `job.id`, over `event.start`, `event.end`, `schedule.id`, `date_label`, and event length. Across all successful optimize captures, that raw job-by-job comparison found the same placements before and after. Therefore, for hard placement rules — service hours, max shift end, max departure, max travel, strict region/tech/skill, etc. — we **cannot** honestly mark PASS from the `jobs` chunks. The optimized job list itself does not show moves, drops, or reassignments needed to prove compliance.

There are also internal mismatches: `stats.time_ratio.work_time.after` is often `0` while 212 optimized jobs still exist with non-zero event lengths, and raw `drive_time` segment sums do not match `stats.drive_time`. Those contradictions mean stats cannot be treated as the sole source of truth.


## Raw jobs comparison method

`jobs_moved` is computed, not trusted from any summary field. For each `optimize.ndjson` file, the analyzer reads all chunks where `type=jobs`, splits by `scope=before|optimized`, then compares each `job.id` on:

- `event.start`
- `event.end`
- `schedule.id`
- `date_label`
- `event.length`

Example checked directly from raw responses:

| Capture | before jobs | optimized jobs | same ids | placement diffs | missing | added |
|---|---:|---:|---|---:|---:|---:|
| `260822-114057-b000-control-future` | 212 | 212 | yes | 0 | 0 | 0 |
| `260822-121430-b2004-flt-buffer-10` | 212 | 212 | yes | 0 | 0 | 0 |
| `260822-121705-b2008-flt-current-buffer-10` | 83 | 83 | yes | 0 | 0 | 0 |

Important nuance: `drive_time.optimized` can change even when `jobs.optimized` does not. Example `b2004-flt-buffer-10`: raw drive segments for job `27777` changed from `9.6` minutes to `19.6` minutes, but the job's `event.start/end` stayed `2026-08-23T00:00:00+00:00 → 00:15:00+00:00`. So this proves buffer math reached the drive-time layer; it does **not** prove the optimizer moved jobs correctly.

## Setup / payload findings

Many successful scenarios were not valid rule tests because BE accepted the PUT but read-back shows the requested key was ignored or remained disabled.

| Issue | Count |
|---|---:|
| `unknown_field_in_payload` | 402 |

### Most common field issues

| Endpoint | Field sent | Issue | Count | Correct key/shape from catalog |
|---|---|---|---:|---|
| `workforce-boundaries` | `service_hours` | `unknown_field_in_payload` | 81 | `default_service_hours`: `{system_default,start,end}` |
| `system-rules` | `restrict_movement_window` | `unknown_field_in_payload` | 55 | `job_movement_restriction_days` |
| `route-efficiency` | `max_travel_distance` | `unknown_field_in_payload` | 39 | `max_travel_distance_miles` |
| `service-commitment` | `drive_time_buffer` | `unknown_field_in_payload` | 36 | `drive_buffer` |
| `system-rules` | `preserve_original_week` | `unknown_field_in_payload` | 28 | `preserve_original_period` |
| `system-rules` | `cross_technician_routing` | `unknown_field_in_payload` | 28 | `allow_cross_technician_routing` bare 0/1 |
| `route-efficiency` | `max_shift_travel_time` | `unknown_field_in_payload` | 26 | `max_shift_travel_time_minutes` |
| `route-efficiency` | `preferred_technician` | `unknown_field_in_payload` | 26 | `preferred_tech_matching`: `soft|strict` |
| `service-commitment` | `region_matching` | `unknown_field_in_payload` | 24 | `region_enforcement`: `soft|strict` |
| `workforce-boundaries` | `max_shift_travel_time` | `unknown_field_in_payload` | 21 | `shift_travel_minutes` |
| `route-efficiency` | `minimize_travel_time` | `unknown_field_in_payload` | 13 | `minimize_travel_time_minutes` |
| `route-efficiency` | `minimize_distance` | `unknown_field_in_payload` | 13 | `minimize_travel_distance_miles` |
| `route-efficiency` | `technician_skill_matching` | `unknown_field_in_payload` | 12 | `tech_skill_matching` bare 0/1 |

## Config rejection categories

| Category | Count |
|---|---:|
| config rejected: ['Preferred Jobs per Day cannot be greater than Max Jobs per Day.'] | 65 |
| max_departure_time wrong type (HH:MM sent; API requires minutes 0-1439) | 36 |
| config rejected: ['Max Shift End Time must be a whole number.'] | 26 |
| workload_balance wrong payload (bare 0/1 expected) | 15 |
| customer_scheduling_preferences wrong payload (bare 0/1 expected) | 12 |
| config rejected: ['Max Shift End Time must be a whole number.', 'Preferred Jobs per Day cannot be greater than Max Jobs per Day.'] | 4 |

## Jobs-per-day and drive-buffer findings

- `jobs_per_day` toolbar scenarios executed: 4
- Jobs-per-day violations observed: 4. Example: max/day stayed at `36` while request set `jobs_per_day=1/5/15` in future week, or stayed `32` in current week.
- `drive_buffer` toolbar scenarios clearly affected drive metrics: future week `drive_buffer=10` changed raw drive `3798.5 → 4375.1`; `drive_buffer=30` changed `3798.5 → 5284.0`; current week `drive_buffer=10` changed `1199.1 → 1591.8`.
- System-level `drive_buffer` scenarios in this bulk run did **not** apply because the generated payload sent `drive_time_buffer`, while the API key is `drive_buffer`.

### Jobs-per-day violation sample

| Scenario | Capture | Expected max/day | Observed max/day |
|---|---|---:|---:|
| `b2000-flt-jpd-1` | `260822-121131-b2000-flt-jpd-1` | 1 | 36 |
| `b2001-flt-jpd-5` | `260822-121210-b2001-flt-jpd-5` | 5 | 36 |
| `b2002-flt-jpd-15` | `260822-121249-b2002-flt-jpd-15` | 15 | 36 |
| `b2007-flt-current-jpd-5` | `260822-121651-b2007-flt-current-jpd-5` | 5 | 32 |

## Can we say the optimized jobs are correct?

**No, not yet.** Based on the API responses, we cannot prove the jobs are correctly optimized against rules, because:

1. Raw `jobs` chunks were compared job-by-job; `scope=optimized` is identical to `scope=before` for every successful capture. `jobs_moved=0` is our derived comparison result, not an API field.
2. Several response chunks contradict each other (`jobs` vs `stats.work_time`, `drive_time` vs `stats.drive_time`).
3. Many intended System Rule setups were not actually active due to wrong keys/shapes; read-back proves this.
4. `manual/optimize` preview does not write explainability feeds, so reasons are unavailable unless we `manual/accept` and then read history/logs/undo.

What we **can** say:

- The manual optimize endpoint is stable enough to stream 292 optimize responses in this run.
- Toolbar `drive_buffer` reaches the engine and changes drive metrics.
- Toolbar `jobs_per_day` did not enforce the requested cap in captured results.
- Current payload generator must be corrected before using this bulk run as proof of System Rule correctness.

## Evidence paths

- Raw matrix: `captures/matrix-results.json`
- Runner logs: `captures/bulk-450-260822-114053.log`, `captures/bulk-450-260822-114053.err`
- Per-scenario evidence: `captures/<timestamp>-<scenario>/request.json`, `config-applied.json`, `optimize.ndjson`, `summary.json`
- Machine-readable analysis: `reports/bulk-450-analysis.json`

## Next concrete actions

1. Commit/push all remaining raw captures + this report.
2. Patch the bulk generator to use exact keys from `rules-catalog.md` and minutes-from-midnight for time fields.
3. Run a smaller corrected 40–60 scenario suite first to verify setup read-back is correct for every module.
4. For true hard-rule proof, run accept/feeds/undo cases so `reasons[]` can validate why jobs moved/dropped.
