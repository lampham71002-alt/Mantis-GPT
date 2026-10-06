import json
from pathlib import Path

BASE_FILTERS = {
    "schedule_ids": "245",
    "start": "2026-08-23T00:00:00+00:00",
    "end": "2026-08-29T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": [],
}


def scenario(name, config=None, filters=None):
    body = dict(BASE_FILTERS)
    if filters:
        body.update(filters)
    cfg = config or {}
    # Disable the baseline max_departure_time so old account state cannot leak into non-SC cases.
    cfg.setdefault("service-commitment", {})
    cfg["service-commitment"].setdefault("max_departure_time", {"status": 0, "value": 960})
    return {"name": name, "config": cfg, "filters": body}

cases = []
# Control
cases.append(scenario("x00-control-all-off"))

# Routing/system gatekeepers
cases += [
    scenario("x01-sys-horizon-7-days", {"system-rules": {"optimization_horizon": {"status": 1, "value": "7_days"}}}),
    scenario("x02-sys-horizon-14-days", {"system-rules": {"optimization_horizon": {"status": 1, "value": "14_days"}}}),
    scenario("x03-sys-restrict-0-days", {"system-rules": {"job_movement_restriction_days": {"status": 1, "value": 0}}}),
    scenario("x04-sys-restrict-1-day", {"system-rules": {"job_movement_restriction_days": {"status": 1, "value": 1}}}),
    scenario("x05-sys-preserve-week", {"system-rules": {"preserve_original_period": {"status": 1, "value": "week"}}}),
    scenario("x06-sys-cross-tech-on", {"system-rules": {"allow_cross_technician_routing": 1}}),
]

# Workforce boundaries
cases += [
    scenario("x10-wb-service-0830-1800", {"workforce-boundaries": {"default_service_hours": {"status": 1, "value": {"system_default": 0, "start": 510, "end": 1080}}}}),
    scenario("x11-wb-service-0900-1700", {"workforce-boundaries": {"default_service_hours": {"status": 1, "value": {"system_default": 0, "start": 540, "end": 1020}}}}),
    scenario("x12-wb-service-impossible-0830-0900", {"workforce-boundaries": {"default_service_hours": {"status": 1, "value": {"system_default": 0, "start": 510, "end": 540}}}}),
    scenario("x13-wb-max-jobs-0", {"workforce-boundaries": {"max_jobs_per_day": {"status": 1, "value": 0}, "preferred_jobs_per_day": {"status": 0, "value": 0}}}),
    scenario("x14-wb-max-jobs-1", {"workforce-boundaries": {"max_jobs_per_day": {"status": 1, "value": 1}, "preferred_jobs_per_day": {"status": 1, "value": 1}}}),
    scenario("x15-wb-max-jobs-5", {"workforce-boundaries": {"max_jobs_per_day": {"status": 1, "value": 5}, "preferred_jobs_per_day": {"status": 1, "value": 5}}}),
    scenario("x16-wb-max-jobs-15", {"workforce-boundaries": {"max_jobs_per_day": {"status": 1, "value": 15}, "preferred_jobs_per_day": {"status": 1, "value": 10}}}),
    scenario("x17-wb-preferred-jobs-10", {"workforce-boundaries": {"preferred_jobs_per_day": {"status": 1, "value": 10}}}),
    scenario("x18-wb-shift-travel-30", {"workforce-boundaries": {"shift_travel_minutes": {"status": 1, "value": 30}}}),
    scenario("x19-wb-max-shift-end-1600", {"workforce-boundaries": {"max_shift_end_time": {"status": 1, "value": 960}}}),
    scenario("x20-wb-max-shift-end-0700", {"workforce-boundaries": {"max_shift_end_time": {"status": 1, "value": 420}}}),
    scenario("x21-wb-workload-balance", {"workforce-boundaries": {"workload_balance": 1}}),
    scenario("x22-wb-service-plus-shift-travel", {"workforce-boundaries": {"default_service_hours": {"status": 1, "value": {"system_default": 0, "start": 510, "end": 1080}}, "shift_travel_minutes": {"status": 1, "value": 30}}}),
]

# Route efficiency
cases += [
    scenario("x30-re-min-travel-time-5", {"route-efficiency": {"minimize_travel_time_minutes": {"status": 1, "value": 5}}}),
    scenario("x31-re-min-distance-05", {"route-efficiency": {"minimize_travel_distance_miles": {"status": 1, "value": 0.5}}}),
    scenario("x32-re-max-travel-0mi", {"route-efficiency": {"max_travel_distance_miles": {"status": 1, "value": 0}}}),
    scenario("x33-re-max-travel-10mi", {"route-efficiency": {"max_travel_distance_miles": {"status": 1, "value": 10}}}),
    scenario("x34-re-max-travel-50mi", {"route-efficiency": {"max_travel_distance_miles": {"status": 1, "value": 50}}}),
    scenario("x35-re-max-shift-travel-0", {"route-efficiency": {"max_shift_travel_time_minutes": {"status": 1, "value": 0}}}),
    scenario("x36-re-max-shift-travel-120", {"route-efficiency": {"max_shift_travel_time_minutes": {"status": 1, "value": 120}}}),
    scenario("x37-re-preferred-tech-soft", {"route-efficiency": {"preferred_tech_matching": {"status": 1, "value": "soft"}}}),
    scenario("x38-re-preferred-tech-strict", {"route-efficiency": {"preferred_tech_matching": {"status": 1, "value": "strict"}}}),
    scenario("x39-re-tech-skill-matching", {"route-efficiency": {"tech_skill_matching": 1}}),
]

# Service commitments
cases += [
    scenario("x50-sc-max-departure-0600", {"service-commitment": {"max_departure_time": {"status": 1, "value": 360}}}),
    scenario("x51-sc-max-departure-1600", {"service-commitment": {"max_departure_time": {"status": 1, "value": 960}}}),
    scenario("x52-sc-max-departure-1800", {"service-commitment": {"max_departure_time": {"status": 1, "value": 1080}}}),
    scenario("x53-sc-arrival-window-0", {"service-commitment": {"arrival_window_hours": {"status": 1, "value": 0}}}),
    scenario("x54-sc-arrival-window-2", {"service-commitment": {"arrival_window_hours": {"status": 1, "value": 2}}}),
    scenario("x55-sc-region-soft", {"service-commitment": {"region_enforcement": {"status": 1, "value": "soft"}}}),
    scenario("x56-sc-region-strict", {"service-commitment": {"region_enforcement": {"status": 1, "value": "strict"}}}),
    scenario("x57-sc-customer-preferences", {"service-commitment": {"customer_scheduling_preferences": 1}}),
    scenario("x58-sc-drive-buffer-0", {"service-commitment": {"drive_buffer": {"status": 1, "value": 0}}}),
    scenario("x59-sc-drive-buffer-10", {"service-commitment": {"drive_buffer": {"status": 1, "value": 10}}}),
    scenario("x60-sc-drive-buffer-30", {"service-commitment": {"drive_buffer": {"status": 1, "value": 30}}}),
    scenario("x61-sc-drive-buffer-plus-max-departure", {"service-commitment": {"drive_buffer": {"status": 1, "value": 30}, "max_departure_time": {"status": 1, "value": 960}}}),
]

# Toolbar/filter constraints
cases += [
    scenario("x70-filter-jobs-per-day-1", filters={"jobs_per_day": 1}),
    scenario("x71-filter-jobs-per-day-5", filters={"jobs_per_day": 5}),
    scenario("x72-filter-jobs-per-day-15", filters={"jobs_per_day": 15}),
    scenario("x73-filter-drive-buffer-0", filters={"drive_buffer": 0}),
    scenario("x74-filter-drive-buffer-10", filters={"drive_buffer": 10}),
    scenario("x75-filter-drive-buffer-30", filters={"drive_buffer": 30}),
]

out = Path(__file__).with_name("expanded-system-scenarios.json")
out.write_text(json.dumps(cases, indent=2))
print(f"wrote {len(cases)} scenarios to {out}")
