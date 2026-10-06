#!/usr/bin/env python3
"""Generate next safe CSV-driven corrected suite (240 cases) after c* setup read-back passed.

Scope: module-rules-testcases.csv only, excluding Custom Rules/day-exclusion/auto lanes that need
separate create/delete/cleanup or accept/undo evidence. Scenario prefix: d*.
"""
import csv, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "scripts" / "csv-corrected-240-scenarios.json"

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

ATOM_RULES = [
    ("Default Service Hours", {"workforce-boundaries": {"default_service_hours": on({"system_default": 0, "start": 510, "end": 1080})}}, "WB service window 08:30-18:00"),
    ("Max Jobs per day", {"workforce-boundaries": {"max_jobs_per_day": on(15)}}, "WB hard cap 15 jobs/day/tech"),
    ("Preferred Jobs per day", {"workforce-boundaries": {"preferred_jobs_per_day": on(10)}}, "WB soft target 10 jobs/day/tech"),
    ("Pre/Post-Shift Travel", {"workforce-boundaries": {"shift_travel_minutes": on(30)}}, "WB pre/post shift travel 30min"),
    ("Max Shift End Time", {"workforce-boundaries": {"max_shift_end_time": on(1080)}}, "WB max shift end 18:00"),
    ("Workload Fairness", {"workforce-boundaries": {"workload_balance": 1}}, "WB workload fairness on"),
    ("Minimize Travel Time", {"route-efficiency": {"minimize_travel_time_minutes": on(5)}}, "RE minimize travel time"),
    ("Minimize Distance", {"route-efficiency": {"minimize_travel_distance_miles": on(3)}}, "RE minimize distance"),
    ("Max Travel Distance", {"route-efficiency": {"max_travel_distance_miles": on(10)}}, "RE max travel distance 10mi"),
    ("Max Shift Travel", {"route-efficiency": {"max_shift_travel_time_minutes": on(120)}}, "RE max shift travel 120min"),
    ("Preferred Tech Soft", {"route-efficiency": {"preferred_tech_matching": on("soft")}}, "RE preferred tech soft"),
    ("Preferred Tech Strict", {"route-efficiency": {"preferred_tech_matching": on("strict")}}, "RE preferred tech strict"),
    ("Skill Matching", {"route-efficiency": {"tech_skill_matching": 1}}, "RE skill matching on"),
    ("Max Last Appt", {"service-commitment": {"max_departure_time": on(960)}}, "SC max last appointment/departure 16:00"),
    ("Max Departure", {"service-commitment": {"max_departure_time": on(960)}}, "SC max departure 16:00"),
    ("Arrival Window", {"service-commitment": {"arrival_window_hours": on(2)}}, "SC arrival window 2h"),
    ("Region Enforcement", {"service-commitment": {"region_enforcement": on("strict")}}, "SC region enforcement strict"),
    ("Drive Buffer Time", {"service-commitment": {"drive_buffer": on(10)}}, "SC drive buffer 10min"),
    ("Customer Scheduling Pref", {"service-commitment": {"customer_scheduling_preferences": 1}}, "SC customer scheduling preferences on"),
]
SKIP_NEEDLES = ["Day Exclusions", "Tech A off", "Custom Rule", "Custom Rules", "force_tech", "keep_period", "time_window", "lock", "route around"]

def config_for_condition(condition):
    low = condition.lower()
    if low.startswith("auto") or any(x.lower() in low for x in SKIP_NEEDLES):
        return None, []
    cfgs, labels = [], []
    for needle, cfg, label in ATOM_RULES:
        if needle.lower() in low:
            cfgs.append(cfg); labels.append(label)
    if not cfgs:
        return None, []
    return merge_cfg(*cfgs), labels

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:54]

rows = list(csv.DictReader((DATA / "module-rules-testcases.csv").open(newline="")))
selected = []
# Balanced pass first: preserve CSV order within each module.
quotas = [("Workforce Boundaries", 70), ("Route Efficiency", 100), ("Service Commitments", 50), ("Cross-Module", 18)]
for mod, quota in quotas:
    n = 0
    for row in rows:
        if row["module"] != mod: continue
        cfg, labels = config_for_condition(row["condition"])
        if cfg is None: continue
        selected.append((row, cfg, labels)); n += 1
        if n >= quota: break
# Top off to exactly 238 non-control cases if quota misses due skips.
seen = {(r["module"], r["id"]) for r,_,_ in selected}
for row in rows:
    if len(selected) >= 238: break
    key = (row["module"], row["id"])
    if key in seen: continue
    cfg, labels = config_for_condition(row["condition"])
    if cfg is None: continue
    selected.append((row, cfg, labels)); seen.add(key)

scenarios = [
    {"name": "d000-control-future-csv", "description": "CSV corrected 240 control future week", "config": {}, "filters": BASE_FUTURE, "expected_source": "control"},
    {"name": "d001-control-current-csv", "description": "CSV corrected 240 control current week", "config": {}, "filters": BASE_CURRENT, "expected_source": "control"},
]
for i, (row, cfg, labels) in enumerate(selected[:238], start=2):
    scenarios.append({
        "name": f"d{i:03d}-{slug(row['module']+'-'+row['id']+'-'+row['condition'])}",
        "description": f"CSV240 {row['module']} #{row['id']}: {row['condition']}",
        "config": cfg,
        "filters": BASE_FUTURE,
        "expected_source": {"file": "module-rules-testcases.csv", "module": row["module"], "id": row["id"], "group": row["group"], "condition": row["condition"], "expected": row["expected"], "conflict": row["conflict"], "mapped_rules": labels},
    })
OUT.write_text(json.dumps(scenarios, indent=2))
counts = {}
for s in scenarios:
    exp = s.get("expected_source")
    mod = exp.get("module") if isinstance(exp, dict) else "control"
    counts[mod] = counts.get(mod, 0) + 1
print(json.dumps({"wrote": len(scenarios), "out": str(OUT), "module_counts": counts}, indent=2))
