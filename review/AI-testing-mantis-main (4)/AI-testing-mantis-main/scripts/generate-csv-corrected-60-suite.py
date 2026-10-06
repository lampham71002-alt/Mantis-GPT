#!/usr/bin/env python3
"""Generate a corrected CSV-driven Mantis API suite from data/*.csv.

Purpose:
- Use module-rules-testcases.csv as the source of expected behavior.
- Use exact API keys/shapes from baseline-snapshot.json/rules-catalog.
- Start with a safe 60-case module suite (no Custom Rules/day exclusions yet) to prove setup read-back + raw-response comparator before scaling to 1,455.
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "scripts" / "csv-corrected-60-scenarios.json"

BASE_FUTURE = {
    "schedule_ids": "245",
    "start": "2026-08-23T00:00:00+00:00",
    "end": "2026-08-29T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": [],
}
BASE_CURRENT = {
    "schedule_ids": "245",
    "start": "2026-08-16T00:00:00+00:00",
    "end": "2026-08-22T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": [6, 0],
}

def on(value):
    return {"status": 1, "value": value}

def merge_cfg(*parts):
    out = {}
    for part in parts:
        for ep, payload in part.items():
            out.setdefault(ep, {}).update(payload)
    return out

def minutes(hhmm: str) -> int:
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?", hhmm, re.I)
    if not m:
        raise ValueError(hhmm)
    h = int(m.group(1)); mi = int(m.group(2) or 0); ap = (m.group(3) or '').upper()
    if ap == 'PM' and h != 12:
        h += 12
    if ap == 'AM' and h == 12:
        h = 0
    return h * 60 + mi

ATOM_RULES = [
    # Workforce Boundaries
    ("Default Service Hours", {"workforce-boundaries": {"default_service_hours": on({"system_default": 0, "start": 510, "end": 1080})}}, "WB service window 08:30-18:00"),
    ("Max Jobs per day", {"workforce-boundaries": {"max_jobs_per_day": on(15)}}, "WB hard cap 15 jobs/day/tech"),
    ("Preferred Jobs per day", {"workforce-boundaries": {"preferred_jobs_per_day": on(10)}}, "WB soft target 10 jobs/day/tech"),
    ("Pre/Post-Shift Travel", {"workforce-boundaries": {"shift_travel_minutes": on(30)}}, "WB pre/post shift travel 30min"),
    ("Max Shift End Time", {"workforce-boundaries": {"max_shift_end_time": on(1080)}}, "WB max shift end 18:00"),
    ("Workload Fairness", {"workforce-boundaries": {"workload_balance": 1}}, "WB workload fairness on"),
    # Route Efficiency
    ("Minimize Travel Time", {"route-efficiency": {"minimize_travel_time_minutes": on(5)}}, "RE minimize travel time"),
    ("Minimize Distance", {"route-efficiency": {"minimize_travel_distance_miles": on(3)}}, "RE minimize distance"),
    ("Max Travel Distance", {"route-efficiency": {"max_travel_distance_miles": on(10)}}, "RE max travel distance 10mi"),
    ("Max Shift Travel", {"route-efficiency": {"max_shift_travel_time_minutes": on(120)}}, "RE max shift travel 120min"),
    ("Preferred Tech Soft", {"route-efficiency": {"preferred_tech_matching": on("soft")}}, "RE preferred tech soft"),
    ("Preferred Tech Strict", {"route-efficiency": {"preferred_tech_matching": on("strict")}}, "RE preferred tech strict"),
    ("Skill Matching", {"route-efficiency": {"tech_skill_matching": 1}}, "RE skill matching on"),
    # Service Commitments
    ("Max Last Appt", {"service-commitment": {"max_departure_time": on(960)}}, "SC max last appointment/departure 16:00"),
    ("Max Departure", {"service-commitment": {"max_departure_time": on(960)}}, "SC max departure 16:00"),
    ("Arrival Window", {"service-commitment": {"arrival_window_hours": on(2)}}, "SC arrival window 2h"),
    ("Region Enforcement", {"service-commitment": {"region_enforcement": on("strict")}}, "SC region enforcement strict"),
    ("Drive Buffer Time", {"service-commitment": {"drive_buffer": on(10)}}, "SC drive buffer 10min"),
    ("Customer Scheduling Pref", {"service-commitment": {"customer_scheduling_preferences": 1}}, "SC customer scheduling preferences on"),
]

def config_for_condition(condition: str):
    cfgs, labels = [], []
    for needle, cfg, label in ATOM_RULES:
        if needle.lower() in condition.lower():
            cfgs.append(cfg); labels.append(label)
    # Day exclusions need concrete tech/calendar ids; Custom Rules need create/delete workflow. Exclude in this first corrected suite.
    if "Day Exclusions" in condition or "Tech A off" in condition:
        return None, ["SKIP day exclusions need tech id mapping"]
    if condition.lower().startswith("auto"):
        return None, ["SKIP auto optimization not preview placement"]
    if not cfgs:
        return None, ["SKIP no direct system config mapping"]
    return merge_cfg(*cfgs), labels

with (DATA / "module-rules-testcases.csv").open(newline="") as f:
    module_rows = list(csv.DictReader(f))

selected = []
# Deterministic, balanced by module/group; start from 1-field/2-field/3-field high-value rows.
for wanted_module, max_count in [("Workforce Boundaries", 24), ("Route Efficiency", 20), ("Service Commitments", 16)]:
    count = 0
    for row in module_rows:
        if row["module"] != wanted_module:
            continue
        cfg, labels = config_for_condition(row["condition"])
        if cfg is None:
            continue
        # Keep early coverage compact; avoid huge all-fields cases in first corrected pass.
        if not any(row["group"].startswith(g) for g in ["1 field", "2 fields", "3 fields"]):
            continue
        selected.append((row, cfg, labels))
        count += 1
        if count >= max_count:
            break

scenarios = []
scenarios.append({
    "name": "c000-control-future-csv",
    "description": "CSV corrected control future week",
    "config": {},
    "filters": BASE_FUTURE,
    "expected_source": "control",
})
scenarios.append({
    "name": "c001-control-current-csv",
    "description": "CSV corrected control current week",
    "config": {},
    "filters": BASE_CURRENT,
    "expected_source": "control",
})

for i, (row, cfg, labels) in enumerate(selected[:58], start=2):
    slug = re.sub(r"[^a-z0-9]+", "-", (row["module"] + "-" + row["id"] + "-" + row["condition"]).lower()).strip("-")[:54]
    scenarios.append({
        "name": f"c{i:03d}-{slug}",
        "description": f"CSV {row['module']} #{row['id']}: {row['condition']}",
        "config": cfg,
        "filters": BASE_FUTURE,
        "expected_source": {
            "file": "module-rules-testcases.csv",
            "module": row["module"],
            "id": row["id"],
            "group": row["group"],
            "condition": row["condition"],
            "expected": row["expected"],
            "conflict": row["conflict"],
            "mapped_rules": labels,
        },
    })

OUT.write_text(json.dumps(scenarios, indent=2))
print(json.dumps({
    "wrote": len(scenarios),
    "out": str(OUT),
    "module_counts": {m: sum(1 for s in scenarios if isinstance(s.get("expected_source"), dict) and s["expected_source"].get("module") == m) for m in ["Workforce Boundaries", "Route Efficiency", "Service Commitments"]},
}, indent=2))
