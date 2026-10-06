| Rule | Config | Result |
| --- | ---: | --- |
| Freeze Window | Until end of work day | ✅ PASS |
| Optimization Window | 7 days | ✅ PASS |
| **Add Drive Buffer Time** | **10 min** | ❌ **FAIL — 5/47 checkable stop gaps violate the buffer** |
| Frozen-job lock attribution | — | ❌ **SCHEMA FAIL — 28 frozen jobs missing `freeze_window` lock** |
| All other checklist rules | OFF | ✅ PASS (config) — `features` confirms all inactive, matching the checklist |

This run isolates Sheet A Service Commitments **case #5** — every rule OFF except **Add Drive Buffer Time = 10 min** — so the config readback matches the checklist exactly (`drive_buffer_time.active=true, configured_minutes=10`; every other feature `active=false`). This is the only S1 run for case #5 kept for the record (an earlier run against schedule 20 with most checklist rules ON was withdrawn — that checklist did not match the account's saved config and produced a `REVIEW_SETUP_MISMATCH` on 22 of 25 fields).

Routing validation result

✅ Freeze Window: `freeze_window.active=true, days=work_day`; `freeze_end=2026-09-16`; all pre-16/09 jobs kept their date/time (except the lock-attribution gap below).
✅ Optimization Window: `optimization_horizon.value=7_days`; horizon 2026-09-15..2026-09-21 matches.
✅ Config isolation: all 22 other checklist rules read back `active=false` — this run's checklist and the API's resolved config agree, so `drive_buffer_time` is the only field under test.
❌ Add Drive Buffer Time = 10 min: 5 of 47 checkable consecutive-stop gaps on schedule 28 are shorter than `to_next_drive_sec + 600s`.
❌ Frozen-job lock attribution: 28 of 303 `outside_freeze_window` jobs have `constraints_applied.locked=false` (no `freeze_window` lock recorded).

## Bug 1 — Add Drive Buffer Time (10 min) violated on 5 of 47 checkable stop gaps

Run: S1 · optimization_id `opt_sandbox_6db3ec21a1091641636d2faa4f643936` · schedule 28
Sheet case: Service Commitments (Sheet A) #5 — "Add Drive Buffer Time (10 min)" (1 field)

Config confirmed isolated and active: `drive_buffer_time = {active: true, configured_minutes: 10, configured_sec: 600}`; every other rule `active: false`.

Of 68 optimized jobs, 47 consecutive-stop pairs carry a computable `gap_to_next_sec` / `required_gap_sec`. 5 violate `gap_to_next_sec ≥ to_next_drive_sec + 600s`:

```text
job 604 (event 600) → job 609, schedule 28, 2026-09-18
  to_next_drive_sec 778 (13.0min)  gap_to_next_sec 1376 (22.9min)  required 1378 (23.0min)
  deficit 2s

job 626 (event 622) → job 658, schedule 28, 2026-09-18
  to_next_drive_sec 581 (9.7min)  gap_to_next_sec 1124 (18.7min)  required 1181 (19.7min)
  deficit 57s

job 703 (event 699) → job 608, schedule 28, 2026-09-19
  to_next_drive_sec 5724 (95.4min)  gap_to_next_sec 3720 (62.0min)  required 6324 (105.4min)
  deficit 2604s (43.4min) — the raw drive time alone (95.4min) already exceeds the observed gap (62.0min)

job 631 (event 627) → job 647, schedule 28, 2026-09-20
  to_next_drive_sec 6256 (104.3min)  gap_to_next_sec 3240 (54.0min)  required 6856 (114.3min)
  deficit 3616s (60.3min) — raw drive time alone (104.3min) exceeds the observed gap (54.0min)

job 676 (event 672) → job 612, schedule 28, 2026-09-18
  to_next_drive_sec 6050 (100.8min)  gap_to_next_sec 600 (10.0min)  required 6650 (110.8min)
  deficit 6050s (100.8min) — the next stop starts only 10 minutes after this one ends, while the
  drive between them alone takes 100.8 minutes; the buffer is entirely absent and drive time itself
  does not fit in the gap
```

Expected: every consecutive-stop gap satisfies `gap_to_next_sec ≥ to_next_drive_sec + 600s`.

Actual: 5/47 gaps fall short — 2 by a small margin (2s, 57s, plausibly a rounding/boundary edge), 3 by a large margin (43–100 minutes) where the raw drive time itself does not fit in the placed gap, meaning the buffer was not applied at all for those legs.

Previously reported: none (this is the first kept audit of case #5; see note above on the withdrawn schedule-20 run).

## Bug 2 — Frozen jobs are not tagged with a `freeze_window` lock (SCHEMA)

Run: S1 · optimization_id `opt_sandbox_6db3ec21a1091641636d2faa4f643936` · schedule 28

28 of 303 `outside_freeze_window` jobs carry `constraints_applied.locked=false`, `lock_reason=null`, while their placement is unchanged.

```text
Examples (job_id, schedule 28): 318, 322, 348, 352, 353, … 23 more
```

Expected: every `outside_freeze_window` job carries `constraints_applied = {locked: true, lock_reason: "freeze_window"}`.

Actual: 28/303 such jobs have `locked: false, lock_reason: null`.

Previously reported: none.

## Not verifiable from these curls

- Technician identity: schedule 28 has no `events` items exposing a non-zero `schedule.user_id`, so per-technician capacity/cross-technician checks are `UNVERIFIABLE` this run (immaterial here since every capacity/technician-matching rule was OFF).

## Appendix — redacted raw job records (Add Drive Buffer Time violations)

Full per-job records from the terminal `completed.feature_test_log.jobs` array, with customer-identifying fields removed (`job_name`, `customer_id`, `customer_name`, `lat`, `lng`, `city`, `state`). Every other field — IDs, schedule, timestamps, drive/distance seconds and meters, `constraints_applied`, `work_hours`, `feature_signals`, `solver_input` — is verbatim from the API response.

### job 604

```json
{
  "event_id": 600,
  "job_id": 604,
  "service_id": 137,
  "service_name": "Monthly Service",
  "job_status": 0,
  "is_recurring": false,
  "location_id": 14763,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": true,
  "routing_status": "optimized",
  "routing_status_reason": null,
  "before": {
    "start": "2026-09-16T00:00:00+00:00",
    "end": "2026-09-16T00:15:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 601,
    "next_job_id": 605,
    "route_stop_index": 0,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-16 07:10:00",
      "end": "2026-09-16 17:50:00",
      "start_unix": 1789542600,
      "end_unix": 1789581000
    }
  },
  "after": {
    "start": "2026-09-18T07:10:00+00:00",
    "end": "2026-09-18T07:25:00+00:00",
    "schedule_id": 28,
    "drive_sec": 6287,
    "distance_m": 170000,
    "downtime_sec": 0,
    "matrix_source": null,
    "to_next_drive_sec": 778,
    "to_next_distance_m": 11217,
    "to_next_matrix_source": null,
    "next_event_id": 605,
    "next_job_id": 609,
    "route_stop_index": 0,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-18 07:10:00",
      "end": "2026-09-18 17:50:00",
      "start_unix": 1789715400,
      "end_unix": 1789753800
    }
  },
  "constraints_applied": {
    "locked": false,
    "lock_reason": null,
    "forced_user_id": null,
    "forced_rule_id": null,
    "preferred_user_id": null,
    "preferred_rule_id": null,
    "preferred_weight": null,
    "position_constraint": null,
    "position_rule_id": null,
    "hard_arrival_window": null,
    "soft_arrival_window": null,
    "move_window": {
      "earliest_unix": 1789542000,
      "latest_unix": 1790013600,
      "feasible_day_labels": []
    },
    "conflict_rule_ids": [],
    "custom_rule_soft": []
  },
  "work_hours": {
    "operating_start_min": 430,
    "operating_end_min": 1070,
    "before_inside_hours": false,
    "after_inside_hours": true
  },
  "feature_signals": {
    "preferred_technician_matching": {
      "preferred_tech_ids": [],
      "preferred_user_id": null,
      "assigned_schedule_id": 28,
      "assigned_user_id": null,
      "mode": null,
      "matched": null
    },
    "technician_skill_matching": {
      "active": false,
      "skill_type": "Monthly Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": false,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-16",
      "location_schedule_rules": [],
      "location_schedule_rule_count": 0,
      "matched_preference_windows": [],
      "note": "arrival_* is custom_rule_hard or location_preference only; not operating hours. Prefer location_schedule_rules / matched_preference_windows to verify honor-customer-preference."
    },
    "arrival_window_duration_override": {
      "active": false,
      "configured_hours": null,
      "arrival_start_unix": null,
      "arrival_end_unix": null,
      "arrival_start_sec": null,
      "arrival_end_sec": null
    },
    "drive_buffer_time": {
      "active": true,
      "configured_minutes": 10,
      "configured_sec": 600,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 1376,
      "required_gap_sec": 1378,
      "slack_above_drive_sec": 598,
      "meets_configured_buffer": false,
      "matrix_source": null,
      "to_next_matrix_source": null,
      "note": "Buffer pads consecutive-stop gaps; depot edges are reserved by planning_resolved. after.drive_sec is OSM travel only. matrix_source/to_next_matrix_source: \"osm\" (Valhalla, fresh or Redis-cached) or \"haversine\" (PHP straight-line fallback when OSM is unusable); null when the leg used the solver-reported fallback path instead of the pre-solve matrix."
    }
  },
  "solver_input": {
    "in_solver_jobs": true,
    "capacity_reverted": false,
    "passes": [
      {
        "solver_pass": "horizon",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-16",
          "28|2026-09-17",
          "28|2026-09-18",
          "28|2026-09-19",
          "28|2026-09-20",
          "28|2026-09-21"
        ],
        "preferred_vehicle_ids": [],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 25800,
        "window_end_sec": 496200,
        "location_schedule_rules": [],
        "skip_reason": null
      },
      {
        "solver_pass": "overflow_repair",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-22",
          "28|2026-09-23",
          "28|2026-09-24",
          "28|2026-09-25",
          "28|2026-09-26"
        ],
        "preferred_vehicle_ids": [],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 544200,
        "window_end_sec": 928200,
        "location_schedule_rules": [],
        "skip_reason": null
      }
    ]
  }
}
```

### job 626

```json
{
  "event_id": 622,
  "job_id": 626,
  "service_id": 141,
  "service_name": "Initial Service",
  "job_status": 1,
  "is_recurring": false,
  "location_id": 14756,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": true,
  "routing_status": "optimized",
  "routing_status_reason": null,
  "before": {
    "start": "2026-09-16T17:00:00+00:00",
    "end": "2026-09-16T18:00:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 623,
    "next_job_id": 627,
    "route_stop_index": 24,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-16 07:10:00",
      "end": "2026-09-16 17:50:00",
      "start_unix": 1789542600,
      "end_unix": 1789581000
    }
  },
  "after": {
    "start": "2026-09-18T08:28:06+00:00",
    "end": "2026-09-18T09:28:06+00:00",
    "schedule_id": 28,
    "drive_sec": 850,
    "distance_m": 13036,
    "downtime_sec": 710,
    "matrix_source": null,
    "to_next_drive_sec": 581,
    "to_next_distance_m": 9565,
    "to_next_matrix_source": null,
    "next_event_id": 654,
    "next_job_id": 658,
    "route_stop_index": 2,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-18 07:10:00",
      "end": "2026-09-18 17:50:00",
      "start_unix": 1789715400,
      "end_unix": 1789753800
    }
  },
  "constraints_applied": {
    "locked": false,
    "lock_reason": null,
    "forced_user_id": null,
    "forced_rule_id": null,
    "preferred_user_id": null,
    "preferred_rule_id": null,
    "preferred_weight": null,
    "position_constraint": null,
    "position_rule_id": null,
    "hard_arrival_window": null,
    "soft_arrival_window": null,
    "move_window": {
      "earliest_unix": 1789542000,
      "latest_unix": 1790013600,
      "feasible_day_labels": []
    },
    "conflict_rule_ids": [],
    "custom_rule_soft": []
  },
  "work_hours": {
    "operating_start_min": 430,
    "operating_end_min": 1070,
    "before_inside_hours": false,
    "after_inside_hours": true
  },
  "feature_signals": {
    "preferred_technician_matching": {
      "preferred_tech_ids": [
        84361423
      ],
      "preferred_user_id": null,
      "assigned_schedule_id": 28,
      "assigned_user_id": null,
      "mode": null,
      "matched": null
    },
    "technician_skill_matching": {
      "active": false,
      "skill_type": "Initial Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": false,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-16",
      "location_schedule_rules": [],
      "location_schedule_rule_count": 0,
      "matched_preference_windows": [],
      "note": "arrival_* is custom_rule_hard or location_preference only; not operating hours. Prefer location_schedule_rules / matched_preference_windows to verify honor-customer-preference."
    },
    "arrival_window_duration_override": {
      "active": false,
      "configured_hours": null,
      "arrival_start_unix": null,
      "arrival_end_unix": null,
      "arrival_start_sec": null,
      "arrival_end_sec": null
    },
    "drive_buffer_time": {
      "active": true,
      "configured_minutes": 10,
      "configured_sec": 600,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 1124,
      "required_gap_sec": 1181,
      "slack_above_drive_sec": 543,
      "meets_configured_buffer": false,
      "matrix_source": null,
      "to_next_matrix_source": null,
      "note": "Buffer pads consecutive-stop gaps; depot edges are reserved by planning_resolved. after.drive_sec is OSM travel only. matrix_source/to_next_matrix_source: \"osm\" (Valhalla, fresh or Redis-cached) or \"haversine\" (PHP straight-line fallback when OSM is unusable); null when the leg used the solver-reported fallback path instead of the pre-solve matrix."
    }
  },
  "solver_input": {
    "in_solver_jobs": true,
    "capacity_reverted": false,
    "passes": [
      {
        "solver_pass": "horizon",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-16",
          "28|2026-09-17",
          "28|2026-09-18",
          "28|2026-09-19",
          "28|2026-09-20",
          "28|2026-09-21"
        ],
        "preferred_vehicle_ids": [
          "28|2026-09-21"
        ],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 457800,
        "window_end_sec": 464400,
        "location_schedule_rules": [],
        "skip_reason": null
      },
      {
        "solver_pass": "overflow_repair",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-22",
          "28|2026-09-23",
          "28|2026-09-24",
          "28|2026-09-25",
          "28|2026-09-26"
        ],
        "preferred_vehicle_ids": [],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 544200,
        "window_end_sec": 928200,
        "location_schedule_rules": [],
        "skip_reason": null
      }
    ]
  }
}
```

### job 703

```json
{
  "event_id": 699,
  "job_id": 703,
  "service_id": 140,
  "service_name": "Call Back Service",
  "job_status": 0,
  "is_recurring": false,
  "location_id": 14739,
  "geo_cluster_id": 4,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": true,
  "routing_status": "optimized",
  "routing_status_reason": null,
  "before": {
    "start": "2026-09-19T07:53:00+00:00",
    "end": "2026-09-19T08:08:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 700,
    "next_job_id": 704,
    "route_stop_index": 9,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-19 07:10:00",
      "end": "2026-09-19 17:50:00",
      "start_unix": 1789801800,
      "end_unix": 1789840200
    }
  },
  "after": {
    "start": "2026-09-19T07:53:00+00:00",
    "end": "2026-09-19T08:08:00+00:00",
    "schedule_id": 28,
    "drive_sec": 0,
    "distance_m": 0,
    "downtime_sec": 0,
    "matrix_source": null,
    "to_next_drive_sec": 5724,
    "to_next_distance_m": 154974,
    "to_next_matrix_source": "osm",
    "next_event_id": 604,
    "next_job_id": 608,
    "route_stop_index": 1,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-19 07:10:00",
      "end": "2026-09-19 17:50:00",
      "start_unix": 1789801800,
      "end_unix": 1789840200
    }
  },
  "constraints_applied": {
    "locked": false,
    "lock_reason": null,
    "forced_user_id": null,
    "forced_rule_id": null,
    "preferred_user_id": null,
    "preferred_rule_id": null,
    "preferred_weight": null,
    "position_constraint": null,
    "position_rule_id": null,
    "hard_arrival_window": null,
    "soft_arrival_window": null,
    "move_window": {
      "earliest_unix": 1789542000,
      "latest_unix": 1790013600,
      "feasible_day_labels": []
    },
    "conflict_rule_ids": [],
    "custom_rule_soft": []
  },
  "work_hours": {
    "operating_start_min": 430,
    "operating_end_min": 1070,
    "before_inside_hours": true,
    "after_inside_hours": true
  },
  "feature_signals": {
    "preferred_technician_matching": {
      "preferred_tech_ids": [],
      "preferred_user_id": null,
      "assigned_schedule_id": 28,
      "assigned_user_id": null,
      "mode": null,
      "matched": null
    },
    "technician_skill_matching": {
      "active": false,
      "skill_type": "Call Back Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": false,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-19",
      "location_schedule_rules": [],
      "location_schedule_rule_count": 0,
      "matched_preference_windows": [],
      "note": "arrival_* is custom_rule_hard or location_preference only; not operating hours. Prefer location_schedule_rules / matched_preference_windows to verify honor-customer-preference."
    },
    "arrival_window_duration_override": {
      "active": false,
      "configured_hours": null,
      "arrival_start_unix": null,
      "arrival_end_unix": null,
      "arrival_start_sec": null,
      "arrival_end_sec": null
    },
    "drive_buffer_time": {
      "active": true,
      "configured_minutes": 10,
      "configured_sec": 600,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 3720,
      "required_gap_sec": 6324,
      "slack_above_drive_sec": -2004,
      "meets_configured_buffer": false,
      "matrix_source": null,
      "to_next_matrix_source": "osm",
      "note": "Buffer pads consecutive-stop gaps; depot edges are reserved by planning_resolved. after.drive_sec is OSM travel only. matrix_source/to_next_matrix_source: \"osm\" (Valhalla, fresh or Redis-cached) or \"haversine\" (PHP straight-line fallback when OSM is unusable); null when the leg used the solver-reported fallback path instead of the pre-solve matrix."
    }
  },
  "solver_input": {
    "in_solver_jobs": true,
    "capacity_reverted": false,
    "passes": []
  }
}
```

### job 631

```json
{
  "event_id": 627,
  "job_id": 631,
  "service_id": 140,
  "service_name": "Call Back Service",
  "job_status": 0,
  "is_recurring": false,
  "location_id": 14763,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": true,
  "routing_status": "optimized",
  "routing_status_reason": null,
  "before": {
    "start": "2026-09-16T21:23:00+00:00",
    "end": "2026-09-16T22:23:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 628,
    "next_job_id": 632,
    "route_stop_index": 29,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-16 07:10:00",
      "end": "2026-09-16 17:50:00",
      "start_unix": 1789542600,
      "end_unix": 1789581000
    }
  },
  "after": {
    "start": "2026-09-20T07:10:00+00:00",
    "end": "2026-09-20T08:10:00+00:00",
    "schedule_id": 28,
    "drive_sec": 6287,
    "distance_m": 170000,
    "downtime_sec": 0,
    "matrix_source": null,
    "to_next_drive_sec": 6256,
    "to_next_distance_m": 171519,
    "to_next_matrix_source": "osm",
    "next_event_id": 643,
    "next_job_id": 647,
    "route_stop_index": 0,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-20 07:10:00",
      "end": "2026-09-20 17:50:00",
      "start_unix": 1789888200,
      "end_unix": 1789926600
    }
  },
  "constraints_applied": {
    "locked": false,
    "lock_reason": null,
    "forced_user_id": null,
    "forced_rule_id": null,
    "preferred_user_id": null,
    "preferred_rule_id": null,
    "preferred_weight": null,
    "position_constraint": null,
    "position_rule_id": null,
    "hard_arrival_window": null,
    "soft_arrival_window": null,
    "move_window": {
      "earliest_unix": 1789542000,
      "latest_unix": 1790013600,
      "feasible_day_labels": []
    },
    "conflict_rule_ids": [],
    "custom_rule_soft": []
  },
  "work_hours": {
    "operating_start_min": 430,
    "operating_end_min": 1070,
    "before_inside_hours": false,
    "after_inside_hours": true
  },
  "feature_signals": {
    "preferred_technician_matching": {
      "preferred_tech_ids": [],
      "preferred_user_id": null,
      "assigned_schedule_id": 28,
      "assigned_user_id": null,
      "mode": null,
      "matched": null
    },
    "technician_skill_matching": {
      "active": false,
      "skill_type": "Call Back Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": false,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-16",
      "location_schedule_rules": [],
      "location_schedule_rule_count": 0,
      "matched_preference_windows": [],
      "note": "arrival_* is custom_rule_hard or location_preference only; not operating hours. Prefer location_schedule_rules / matched_preference_windows to verify honor-customer-preference."
    },
    "arrival_window_duration_override": {
      "active": false,
      "configured_hours": null,
      "arrival_start_unix": null,
      "arrival_end_unix": null,
      "arrival_start_sec": null,
      "arrival_end_sec": null
    },
    "drive_buffer_time": {
      "active": true,
      "configured_minutes": 10,
      "configured_sec": 600,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 3240,
      "required_gap_sec": 6856,
      "slack_above_drive_sec": -3016,
      "meets_configured_buffer": false,
      "matrix_source": null,
      "to_next_matrix_source": "osm",
      "note": "Buffer pads consecutive-stop gaps; depot edges are reserved by planning_resolved. after.drive_sec is OSM travel only. matrix_source/to_next_matrix_source: \"osm\" (Valhalla, fresh or Redis-cached) or \"haversine\" (PHP straight-line fallback when OSM is unusable); null when the leg used the solver-reported fallback path instead of the pre-solve matrix."
    }
  },
  "solver_input": {
    "in_solver_jobs": true,
    "capacity_reverted": false,
    "passes": [
      {
        "solver_pass": "horizon",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-16",
          "28|2026-09-17",
          "28|2026-09-18",
          "28|2026-09-19",
          "28|2026-09-20",
          "28|2026-09-21"
        ],
        "preferred_vehicle_ids": [],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 25800,
        "window_end_sec": 496200,
        "location_schedule_rules": [],
        "skip_reason": null
      },
      {
        "solver_pass": "overflow_repair",
        "stop_sent": true,
        "locked": false,
        "allowed_vehicle_ids": [
          "28|2026-09-22",
          "28|2026-09-23",
          "28|2026-09-24",
          "28|2026-09-25",
          "28|2026-09-26"
        ],
        "preferred_vehicle_ids": [],
        "required_region_ids": [],
        "required_skill_ids": [],
        "window_start_sec": 544200,
        "window_end_sec": 928200,
        "location_schedule_rules": [],
        "skip_reason": null
      }
    ]
  }
}
```

### job 676

```json
{
  "event_id": 672,
  "job_id": 676,
  "service_id": 137,
  "service_name": "Monthly Service",
  "job_status": 0,
  "is_recurring": false,
  "location_id": 14739,
  "geo_cluster_id": 4,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": true,
  "routing_status": "optimized",
  "routing_status_reason": null,
  "before": {
    "start": "2026-09-18T10:30:00+00:00",
    "end": "2026-09-18T11:30:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 673,
    "next_job_id": 677,
    "route_stop_index": 12,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-18 07:10:00",
      "end": "2026-09-18 17:50:00",
      "start_unix": 1789715400,
      "end_unix": 1789753800
    }
  },
  "after": {
    "start": "2026-09-18T10:30:00+00:00",
    "end": "2026-09-18T11:30:00+00:00",
    "schedule_id": 28,
    "drive_sec": 0,
    "distance_m": 0,
    "downtime_sec": 0,
    "matrix_source": null,
    "to_next_drive_sec": 6050,
    "to_next_distance_m": 164417,
    "to_next_matrix_source": "osm",
    "next_event_id": 608,
    "next_job_id": 612,
    "route_stop_index": 4,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-18 07:10:00",
      "end": "2026-09-18 17:50:00",
      "start_unix": 1789715400,
      "end_unix": 1789753800
    }
  },
  "constraints_applied": {
    "locked": false,
    "lock_reason": null,
    "forced_user_id": null,
    "forced_rule_id": null,
    "preferred_user_id": null,
    "preferred_rule_id": null,
    "preferred_weight": null,
    "position_constraint": null,
    "position_rule_id": null,
    "hard_arrival_window": null,
    "soft_arrival_window": null,
    "move_window": {
      "earliest_unix": 1789542000,
      "latest_unix": 1790013600,
      "feasible_day_labels": []
    },
    "conflict_rule_ids": [],
    "custom_rule_soft": []
  },
  "work_hours": {
    "operating_start_min": 430,
    "operating_end_min": 1070,
    "before_inside_hours": true,
    "after_inside_hours": true
  },
  "feature_signals": {
    "preferred_technician_matching": {
      "preferred_tech_ids": [],
      "preferred_user_id": null,
      "assigned_schedule_id": 28,
      "assigned_user_id": null,
      "mode": null,
      "matched": null
    },
    "technician_skill_matching": {
      "active": false,
      "skill_type": "Monthly Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": false,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-18",
      "location_schedule_rules": [],
      "location_schedule_rule_count": 0,
      "matched_preference_windows": [],
      "note": "arrival_* is custom_rule_hard or location_preference only; not operating hours. Prefer location_schedule_rules / matched_preference_windows to verify honor-customer-preference."
    },
    "arrival_window_duration_override": {
      "active": false,
      "configured_hours": null,
      "arrival_start_unix": null,
      "arrival_end_unix": null,
      "arrival_start_sec": null,
      "arrival_end_sec": null
    },
    "drive_buffer_time": {
      "active": true,
      "configured_minutes": 10,
      "configured_sec": 600,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 600,
      "required_gap_sec": 6650,
      "slack_above_drive_sec": -5450,
      "meets_configured_buffer": false,
      "matrix_source": null,
      "to_next_matrix_source": "osm",
      "note": "Buffer pads consecutive-stop gaps; depot edges are reserved by planning_resolved. after.drive_sec is OSM travel only. matrix_source/to_next_matrix_source: \"osm\" (Valhalla, fresh or Redis-cached) or \"haversine\" (PHP straight-line fallback when OSM is unusable); null when the leg used the solver-reported fallback path instead of the pre-solve matrix."
    }
  },
  "solver_input": {
    "in_solver_jobs": true,
    "capacity_reverted": false,
    "passes": []
  }
}
```

## Run summary

| Run | Requested schedules | Range | Calendar jobs | Optimized jobs | Result |
| --- | --- | --- | ---: | ---: | --- |
| S1 | 28 | 2026-09-06 → 2026-09-26 | 637 | 68 | success |

Raw output: `captures/260915-1200-TC5-S1.txt` (local only).
