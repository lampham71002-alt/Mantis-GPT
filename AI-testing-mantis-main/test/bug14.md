| Rule | Config | Result |
| --- | ---: | --- |
| Freeze Window | Until end of work day | ✅ PASS |
| Optimization Window | 7 days | ✅ PASS |
| **Customer Scheduling Preferences** | **ON** | ⚠️ **OBSERVED — 1 job placed outside its only allowed day; not a confirmed FAIL (soft rule)** |
| Frozen-job lock attribution | — | ❌ SCHEMA FAIL — same 28 jobs as bug15.md Bug 2 (not re-filed) |
| All other checklist rules | OFF | ✅ PASS (config) — `features` confirms all inactive, matching the checklist |

This is **not a bug entry** in the strict sense (Customer Scheduling Preferences is Soft — `mantis-rule-logic.md` §19: "Never FAILs alone, but a PASS verdict with jobs that still don't honor the stated preference should carry a warning for investigation rather than a silent PASS"). Logged here per that guidance and Sheet A Service Commitments **case #4**, which is already recorded as `Failed / cannot verify` in `sheet-case-catalog.md`.

Config isolation confirmed: `customer_scheduling_preferences.active=true`; every other rule `active=false`/`0`.

## Case to watch — Case #4: Customer Scheduling Preferences (ON), Monday-only preference not honored

Run: S1 · optimization_id `opt_sandbox_ae2c11c2273756a0ec446cd4f106027e` · schedule 28
Sheet case: Service Commitments (Sheet A) #4 — "Customer Scheduling Preferences (ON)" (1 field)

16 of 637 jobs carry a customer location-schedule preference. 13 have a wide preference (nearly every day of the week), trivially satisfied by any placement. 4 have a narrow preference (Monday only): `job 626, 707, 734, 761`.

```text
job 626, schedule 28, optimized
Preference: DAY_OF_WEEK Monday only (05:00-09:00 window)
Placed:     Sunday 2026-09-20 07:00 (after.start)
matched_preference_windows: []  arrival_window_source: null
Move window allowed through 2026-09-21 (a Monday) — the one Monday inside
the horizon was not used for this job even though the job was routed.
```

The other 3 Monday-only jobs (`707`, `734`, `761`) ended up `unassigned` — not evidence of a day-preference violation (no placement to check), possibly a capacity/data gap instead.

Expected (soft, best-effort): route job 626 on Monday 2026-09-21 when a valid slot exists within its move window, per the stated preference.

Actual: job 626 is routed on Sunday 2026-09-20, one day before the only Monday available, with no matched preference window.

Verdict: **⚠️ OBSERVED / candidate for follow-up**, not `FAIL` — Customer Scheduling Preferences is Soft and this run has only one clean witness. Re-run with more Monday-only (or other narrow) preference cases across schedules to confirm whether this is systematic before promoting to a bug.

Previously reported: Sheet A case #4 already carries `Failed / cannot verify` in `sheet-case-catalog.md` (external sheet status, not a local `test/bugN.md`); this is the first local run with isolated config and a concrete witness.

## Not a new bug: frozen-job lock attribution

The same 28 `outside_freeze_window` jobs missing `constraints_applied.locked=true/lock_reason=freeze_window` from bug15.md Bug 2 reappear here (identical job IDs, same schedule 28 dataset: `318, 322, 348, 352, 353, 378, 382, 383, 408, 413, 438, 442, 443, 468, 472, 473, 498, 502, 503, 528, 532, 533, 558, 562, 563, 588, 592, 593`). Not re-filed — see bug15.md Bug 2 for the original report.

## Appendix — redacted raw job records (Customer Scheduling Preferences)

Full per-job records from the terminal `completed.feature_test_log.jobs` array, with customer-identifying fields removed (`job_name`, `customer_id`, `customer_name`, `lat`, `lng`, `city`, `state`). Every other field — IDs, schedule, timestamps, drive/distance seconds and meters, `constraints_applied`, `work_hours`, `feature_signals`, `solver_input` — is verbatim from the API response.

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
      "start": "2026-09-16 07:00:00",
      "end": "2026-09-16 18:00:00",
      "start_unix": 1789542000,
      "end_unix": 1789581600
    }
  },
  "after": {
    "start": "2026-09-20T07:00:00+00:00",
    "end": "2026-09-20T08:00:00+00:00",
    "schedule_id": 28,
    "drive_sec": 6528,
    "distance_m": 176094,
    "downtime_sec": 0,
    "matrix_source": null,
    "to_next_drive_sec": 6110,
    "to_next_distance_m": 169056,
    "to_next_matrix_source": "osm",
    "next_event_id": 609,
    "next_job_id": 613,
    "route_stop_index": 0,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-20 07:00:00",
      "end": "2026-09-20 18:00:00",
      "start_unix": 1789887600,
      "end_unix": 1789927200
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
    "operating_start_min": 420,
    "operating_end_min": 1080,
    "before_inside_hours": true,
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
      "active": true,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-16",
      "location_schedule_rules": [
        {
          "status": 1,
          "rule_type": "DAY_OF_WEEK",
          "start_time": 300,
          "end_time": 540,
          "rule_payload": {
            "days": [
              "mon"
            ]
          }
        }
      ],
      "location_schedule_rule_count": 1,
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
      "active": false,
      "configured_minutes": 0,
      "configured_sec": 0,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": 2460,
      "required_gap_sec": null,
      "slack_above_drive_sec": -3650,
      "meets_configured_buffer": null,
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
        "window_start_sec": 25200,
        "window_end_sec": 496800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
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
        "window_start_sec": 543600,
        "window_end_sec": 928800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
        "skip_reason": null
      }
    ]
  }
}
```

### job 707

```json
{
  "event_id": 703,
  "job_id": 707,
  "service_id": 138,
  "service_name": "Quarterly Service",
  "job_status": 1,
  "is_recurring": false,
  "location_id": 14756,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": false,
  "routing_status": "unassigned",
  "routing_status_reason": "solver_unassigned",
  "before": {
    "start": "2026-09-19T11:23:00+00:00",
    "end": "2026-09-19T11:53:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 704,
    "next_job_id": 708,
    "route_stop_index": 13,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-19 07:00:00",
      "end": "2026-09-19 18:00:00",
      "start_unix": 1789801200,
      "end_unix": 1789840800
    }
  },
  "after": null,
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
    "operating_start_min": 420,
    "operating_end_min": 1080,
    "before_inside_hours": true,
    "after_inside_hours": null
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
      "skill_type": "Quarterly Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": true,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-19",
      "location_schedule_rules": [
        {
          "status": 1,
          "rule_type": "DAY_OF_WEEK",
          "start_time": 300,
          "end_time": 540,
          "rule_payload": {
            "days": [
              "mon"
            ]
          }
        }
      ],
      "location_schedule_rule_count": 1,
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
      "active": false,
      "configured_minutes": 0,
      "configured_sec": 0,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": null,
      "required_gap_sec": null,
      "slack_above_drive_sec": null,
      "meets_configured_buffer": null,
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
        "window_start_sec": 25200,
        "window_end_sec": 496800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
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
        "window_start_sec": 543600,
        "window_end_sec": 928800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
        "skip_reason": null
      }
    ]
  }
}
```

### job 734

```json
{
  "event_id": 730,
  "job_id": 734,
  "service_id": 141,
  "service_name": "Initial Service",
  "job_status": 1,
  "is_recurring": false,
  "location_id": 14756,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": false,
  "routing_status": "unassigned",
  "routing_status_reason": "solver_unassigned",
  "before": {
    "start": "2026-09-20T08:45:00+00:00",
    "end": "2026-09-20T09:00:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 731,
    "next_job_id": 735,
    "route_stop_index": 11,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-20 07:00:00",
      "end": "2026-09-20 18:00:00",
      "start_unix": 1789887600,
      "end_unix": 1789927200
    }
  },
  "after": null,
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
    "operating_start_min": 420,
    "operating_end_min": 1080,
    "before_inside_hours": true,
    "after_inside_hours": null
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
      "active": true,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": null,
      "arrival_end_sec": null,
      "arrival_window_source": null,
      "arrival_anchor_day": "2026-09-20",
      "location_schedule_rules": [
        {
          "status": 1,
          "rule_type": "DAY_OF_WEEK",
          "start_time": 300,
          "end_time": 540,
          "rule_payload": {
            "days": [
              "mon"
            ]
          }
        }
      ],
      "location_schedule_rule_count": 1,
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
      "active": false,
      "configured_minutes": 0,
      "configured_sec": 0,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": null,
      "required_gap_sec": null,
      "slack_above_drive_sec": null,
      "meets_configured_buffer": null,
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
        "window_start_sec": 25200,
        "window_end_sec": 496800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
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
        "window_start_sec": 543600,
        "window_end_sec": 928800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
        "skip_reason": null
      }
    ]
  }
}
```

### job 761

```json
{
  "event_id": 757,
  "job_id": 761,
  "service_id": 138,
  "service_name": "Quarterly Service",
  "job_status": 1,
  "is_recurring": false,
  "location_id": 14756,
  "geo_cluster_id": 1,
  "region_ids": [],
  "region_label": "",
  "schedule_id": 28,
  "is_routed": false,
  "routing_status": "unassigned",
  "routing_status_reason": "solver_unassigned",
  "before": {
    "start": "2026-09-21T06:08:00+00:00",
    "end": "2026-09-21T07:08:00+00:00",
    "schedule_id": 28,
    "drive_sec": null,
    "distance_m": null,
    "downtime_sec": null,
    "matrix_source": null,
    "to_next_drive_sec": null,
    "to_next_distance_m": null,
    "to_next_matrix_source": null,
    "next_event_id": 758,
    "next_job_id": 762,
    "route_stop_index": 7,
    "time_window": {
      "type": "anytime",
      "start": "2026-09-21 07:00:00",
      "end": "2026-09-21 18:00:00",
      "start_unix": 1789974000,
      "end_unix": 1790013600
    }
  },
  "after": null,
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
    "operating_start_min": 420,
    "operating_end_min": 1080,
    "before_inside_hours": false,
    "after_inside_hours": null
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
      "skill_type": "Quarterly Service"
    },
    "region_enforcement": {
      "active": false,
      "in_region": false,
      "region_ids": [],
      "region_label": "",
      "mode": null
    },
    "customer_scheduling_preferences": {
      "active": true,
      "move_earliest_unix": 1789542000,
      "move_latest_unix": 1790013600,
      "arrival_start_sec": 1789966800,
      "arrival_end_sec": 1789981200,
      "arrival_window_source": "location_preference",
      "arrival_anchor_day": "2026-09-21",
      "location_schedule_rules": [
        {
          "status": 1,
          "rule_type": "DAY_OF_WEEK",
          "start_time": 300,
          "end_time": 540,
          "rule_payload": {
            "days": [
              "mon"
            ]
          }
        }
      ],
      "location_schedule_rule_count": 1,
      "matched_preference_windows": [
        {
          "rule_type": "DAY_OF_WEEK",
          "start_time_min": 300,
          "end_time_min": 540,
          "start_unix": 1789966800,
          "end_unix": 1789981200,
          "rule_payload": {
            "days": [
              "mon"
            ]
          }
        }
      ],
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
      "active": false,
      "configured_minutes": 0,
      "configured_sec": 0,
      "includes_in_drive_sec": false,
      "gap_to_next_sec": null,
      "required_gap_sec": null,
      "slack_above_drive_sec": null,
      "meets_configured_buffer": null,
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
        "window_start_sec": 25200,
        "window_end_sec": 496800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
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
        "window_start_sec": 543600,
        "window_end_sec": 928800,
        "location_schedule_rules": [
          {
            "status": 1,
            "rule_type": "DAY_OF_WEEK",
            "start_time": 300,
            "end_time": 540,
            "rule_payload": {
              "days": [
                "mon"
              ]
            }
          }
        ],
        "skip_reason": null
      }
    ]
  }
}
```

## Run summary

| Run | Requested schedules | Range | Calendar jobs | Optimized jobs | Result |
| --- | --- | --- | ---: | ---: | --- |
| S1 | 28 | 2026-09-06 → 2026-09-26 | 637 | 86 | success |

Raw output: `captures/260915-1300-TC4-S1.txt` (local only).
