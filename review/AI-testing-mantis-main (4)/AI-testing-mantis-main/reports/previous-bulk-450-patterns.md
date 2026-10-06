# Previous Bulk 450 Pattern Analysis

Generated: `2026-08-22T17:53:15`

## What the previous API responses actually show

| Raw layer | Finding |
|---|---|
| Jobs | `0 / 292` successful streams changed job placement. All successful raw jobs retained same job-id set and same start/end/date/schedule. |
| Drive time | `292 / 292` changed drive-time segments. This is real API evidence but does not by itself prove job movement. |
| Routes | `292 / 292` changed route polyline chunks. Route geometry changed even when jobs placement did not. |
| Stats | work-time mismatch `292`, drive-time mismatch `292`. Stats cannot be sole truth source. |

## Drive delta distribution

| Optimized-before drive delta | Count | Interpretation |
|---:|---:|---|
| 77.9 | 286 | default future-week geometry/route delta |
| -26.8 | 3 | current-week delta |
| 576.6 | 1 | drive_buffer/filter or special route effect |
| 1485.5 | 1 | drive_buffer/filter or special route effect |
| 392.7 | 1 | drive_buffer/filter or special route effect |

## Route changed chunks distribution

| Changed route chunks | Count |
|---:|---:|
| 6 | 288 |
| 1 | 4 |

## Job count distribution

| before jobs | optimized jobs | changed jobs | count |
|---:|---:|---:|---:|
| 212 | 212 | 0 | 288 |
| 83 | 83 | 0 | 4 |

## Jobs-per-day strict violation samples

These are valid defect candidates because the request carried a direct toolbar filter and raw summary still exceeded the cap.

| Scenario | Capture | Expected max/day | Observed max/day |
|---|---|---:|---:|
| `b2000-flt-jpd-1` | `260822-121131-b2000-flt-jpd-1` | 1 | 36 |
| `b2001-flt-jpd-5` | `260822-121210-b2001-flt-jpd-5` | 5 | 36 |
| `b2002-flt-jpd-15` | `260822-121249-b2002-flt-jpd-15` | 15 | 36 |
| `b2007-flt-current-jpd-5` | `260822-121651-b2007-flt-current-jpd-5` | 5 | 32 |

## Setup problems from previous generator

Previous bulk generator used wrong names/shapes for many API settings. The corrected suite now running fixes these before any new verdict is made.

| Endpoint | Field sent before | Issue | Count |
|---|---|---|---:|
| `workforce-boundaries` | `service_hours` | `unknown_field_in_payload` | 81 |
| `system-rules` | `restrict_movement_window` | `unknown_field_in_payload` | 55 |
| `route-efficiency` | `max_travel_distance` | `unknown_field_in_payload` | 39 |
| `service-commitment` | `drive_time_buffer` | `unknown_field_in_payload` | 36 |
| `system-rules` | `preserve_original_week` | `unknown_field_in_payload` | 28 |
| `system-rules` | `cross_technician_routing` | `unknown_field_in_payload` | 28 |
| `route-efficiency` | `max_shift_travel_time` | `unknown_field_in_payload` | 26 |
| `route-efficiency` | `preferred_technician` | `unknown_field_in_payload` | 26 |
| `service-commitment` | `region_matching` | `unknown_field_in_payload` | 24 |
| `workforce-boundaries` | `max_shift_travel_time` | `unknown_field_in_payload` | 21 |
| `route-efficiency` | `minimize_travel_time` | `unknown_field_in_payload` | 13 |
| `route-efficiency` | `minimize_distance` | `unknown_field_in_payload` | 13 |
| `route-efficiency` | `technician_skill_matching` | `unknown_field_in_payload` | 12 |

## Config rejection categories

| Error category | Count |
|---|---:|
| config rejected: ['Preferred Jobs per Day cannot be greater than Max Jobs per Day.'] | 65 |
| config rejected: ['Max Shift End Time must be a whole number.'] | 26 |
| workload_balance wrong payload (bare 0/1 expected) | 15 |
| max_departure_time wrong type (HH:MM sent; API requires minutes 0-1439) | 36 |
| customer_scheduling_preferences wrong payload (bare 0/1 expected) | 12 |
| config rejected: ['Max Shift End Time must be a whole number.', 'Preferred Jobs per Day cannot be greater than Max Jobs per Day.'] | 4 |

## Carry-forward rules for the corrected run

1. Do not decide by one field. Compare raw `jobs`, `drive_time`, `route`, `stats`, and later `feeds/logs`.
2. A job moved to another date/day can be correct; classify added/missing/date-changed/time-changed/schedule-changed separately.
3. If jobs unchanged but drive/route changed, verdict can be `REACHES_ENGINE` for route/drive layer only, not placement PASS.
4. If setup read-back mismatches intended CSV rule, verdict is `SETUP_FAIL`; do not judge optimizer behavior.
5. For hard-rule proof, corrected run needs either changed jobs in `jobs.optimized` or accept/feed logs explaining no-move outcome.
