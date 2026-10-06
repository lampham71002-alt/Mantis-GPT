import itertools
import json
from pathlib import Path

OUT = Path('/Users/chanhtran/var/gorilladesk-v2-web/.claude/skills/mantis-routing/scripts/bulk-450-system-filter-scenarios.json')

BASE_FUTURE = {
    "schedule_ids": "245",
    "start": "2026-08-23T00:00:00+00:00",
    "end": "2026-08-29T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": []
}
BASE_CURRENT = {
    "schedule_ids": "245",
    "start": "2026-08-16T00:00:00+00:00",
    "end": "2026-08-22T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": [6, 0]
}

def scenario(name, config=None, filters=None, desc=''):
    return {
        "name": name,
        "description": desc or name,
        "config": config or {},
        "filters": filters or BASE_FUTURE,
    }

def cfg(ep, key, value):
    return {ep: {key: value}}

def merge_cfg(*parts):
    out = {}
    for part in parts:
        for ep, obj in part.items():
            out.setdefault(ep, {}).update(obj)
    return out

def on(value):
    return {"status": 1, "value": value}

atoms = []
# system rules
atoms += [
    ("sys-horizon-7", cfg("system-rules", "optimization_horizon", on("7_days"))),
    ("sys-horizon-14", cfg("system-rules", "optimization_horizon", on("14_days"))),
    ("sys-restrict-0", cfg("system-rules", "restrict_movement_window", on("0_days"))),
    ("sys-restrict-1", cfg("system-rules", "restrict_movement_window", on("1_day"))),
    ("sys-preserve-week", cfg("system-rules", "preserve_original_week", on(True))),
    ("sys-cross-tech", cfg("system-rules", "cross_technician_routing", on(True))),
]
# workforce
atoms += [
    ("wb-service-0830-1800", cfg("workforce-boundaries", "service_hours", {"status":1,"value":{"start":"08:30","end":"18:00"}})),
    ("wb-service-0900-1700", cfg("workforce-boundaries", "service_hours", {"status":1,"value":{"start":"09:00","end":"17:00"}})),
    ("wb-service-tight", cfg("workforce-boundaries", "service_hours", {"status":1,"value":{"start":"08:30","end":"09:00"}})),
    ("wb-max-jobs-1", cfg("workforce-boundaries", "max_jobs_per_day", on(1))),
    ("wb-max-jobs-5", cfg("workforce-boundaries", "max_jobs_per_day", on(5))),
    ("wb-max-jobs-15", cfg("workforce-boundaries", "max_jobs_per_day", on(15))),
    ("wb-pref-jobs-10", cfg("workforce-boundaries", "preferred_jobs_per_day", on(10))),
    ("wb-shift-travel-30", cfg("workforce-boundaries", "max_shift_travel_time", on(30))),
    ("wb-shift-end-1600", cfg("workforce-boundaries", "max_shift_end_time", on("16:00"))),
    ("wb-shift-end-0700", cfg("workforce-boundaries", "max_shift_end_time", on("07:00"))),
    ("wb-balance", cfg("workforce-boundaries", "workload_balance", on(True))),
]
# route efficiency
atoms += [
    ("re-min-travel", cfg("route-efficiency", "minimize_travel_time", on(True))),
    ("re-min-distance", cfg("route-efficiency", "minimize_distance", on(True))),
    ("re-max-travel-0", cfg("route-efficiency", "max_travel_distance", on(0))),
    ("re-max-travel-10", cfg("route-efficiency", "max_travel_distance", on(10))),
    ("re-max-travel-50", cfg("route-efficiency", "max_travel_distance", on(50))),
    ("re-shift-travel-0", cfg("route-efficiency", "max_shift_travel_time", on(0))),
    ("re-shift-travel-120", cfg("route-efficiency", "max_shift_travel_time", on(120))),
    ("re-pref-tech-soft", cfg("route-efficiency", "preferred_technician", {"status":1,"value":"soft"})),
    ("re-pref-tech-strict", cfg("route-efficiency", "preferred_technician", {"status":1,"value":"strict"})),
    ("re-skill", cfg("route-efficiency", "technician_skill_matching", on(True))),
]
# service commitments
atoms += [
    ("sc-depart-0600", cfg("service-commitment", "max_departure_time", on("06:00"))),
    ("sc-depart-1600", cfg("service-commitment", "max_departure_time", on("16:00"))),
    ("sc-depart-1800", cfg("service-commitment", "max_departure_time", on("18:00"))),
    ("sc-arrival-2", cfg("service-commitment", "arrival_window_hours", on(2))),
    ("sc-region-soft", cfg("service-commitment", "region_matching", {"status":1,"value":"soft"})),
    ("sc-region-strict", cfg("service-commitment", "region_matching", {"status":1,"value":"strict"})),
    ("sc-cust-pref", cfg("service-commitment", "customer_scheduling_preferences", on(True))),
    ("sc-buffer-0", cfg("service-commitment", "drive_time_buffer", on(0))),
    ("sc-buffer-10", cfg("service-commitment", "drive_time_buffer", on(10))),
    ("sc-buffer-30", cfg("service-commitment", "drive_time_buffer", on(30))),
]
filter_atoms = [
    ("flt-jpd-1", {**BASE_FUTURE, "jobs_per_day": 1}),
    ("flt-jpd-5", {**BASE_FUTURE, "jobs_per_day": 5}),
    ("flt-jpd-15", {**BASE_FUTURE, "jobs_per_day": 15}),
    ("flt-buffer-0", {**BASE_FUTURE, "drive_buffer": 0}),
    ("flt-buffer-10", {**BASE_FUTURE, "drive_buffer": 10}),
    ("flt-buffer-30", {**BASE_FUTURE, "drive_buffer": 30}),
    ("flt-current-week", BASE_CURRENT),
    ("flt-current-jpd-5", {**BASE_CURRENT, "jobs_per_day": 5}),
    ("flt-current-buffer-10", {**BASE_CURRENT, "drive_buffer": 10}),
]

scenarios = []
scenarios.append(scenario("b000-control-future", desc="control future week"))
scenarios.append(scenario("b001-control-current", filters=BASE_CURRENT, desc="control current week"))

# Singles
for i, (name, c) in enumerate(atoms):
    scenarios.append(scenario(f"b1{i:03d}-{name}", c, BASE_FUTURE, f"single {name}"))
for i, (name, f) in enumerate(filter_atoms):
    scenarios.append(scenario(f"b2{i:03d}-{name}", {}, f, f"single filter {name}"))

# Pairwise rule combos
idx = 0
for (n1,c1),(n2,c2) in itertools.combinations(atoms, 2):
    scenarios.append(scenario(f"b3{idx:03d}-{n1}__{n2}"[:80], merge_cfg(c1,c2), BASE_FUTURE, f"pair {n1} + {n2}"))
    idx += 1

# Rule + filter combos, prioritize filters that change constraints
idx = 0
priority_filters = filter_atoms[:6] + filter_atoms[7:]
for n,c in atoms:
    for fn,f in priority_filters:
        scenarios.append(scenario(f"b4{idx:03d}-{n}__{fn}"[:80], c, f, f"rule {n} + filter {fn}"))
        idx += 1

# Trim to 450 to target ~3k API calls with restore/setup/optimize/readback overhead.
scenarios = scenarios[:450]
OUT.write_text(json.dumps(scenarios, indent=2))
print(f"wrote {len(scenarios)} scenarios to {OUT}")
print("estimated_api_calls", len(scenarios) * 7, "conservative")
