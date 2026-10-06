#!/usr/bin/env python3
"""Generate rule-based core business API scenarios.

These scenarios are intentionally different from the bulk settings matrix: each case still
sets the relevant rule state as setup, but the coverage target is only the three feature
quality endpoints: manual/optimize, autopilot/jobs, autopilot/routes. Filters are varied
from the rule being tested instead of keeping one fixed toolbar payload.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "core-3api-rule-filter-scenarios.json"
SRC_FILES = [
    ROOT / "scripts" / "csv-corrected-240-scenarios.json",
    ROOT / "scripts" / "csv-corrected-cross-240-scenarios.json",
]

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


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:70]


def source_text(sc):
    exp = sc.get("expected_source")
    if isinstance(exp, dict):
        return " | ".join(str(exp.get(k, "")) for k in ["module", "group", "condition", "expected", "conflict"])
    return sc.get("description", "")


def variants_for(sc):
    text = source_text(sc).lower()
    base = dict(BASE_FUTURE)
    variants = []

    def add(label, **patch):
        f = dict(base)
        f.update(patch)
        variants.append((label, f))

    # Controls: compare current vs future sandbox/manual behavior.
    if not sc.get("config"):
        return [
            ("control-future-all", dict(BASE_FUTURE)),
            ("control-current-exclude", dict(BASE_CURRENT)),
            ("control-future-no-recurring", {**BASE_FUTURE, "inc": ""}),
            ("control-future-drive-buffer-10", {**BASE_FUTURE, "drive_buffer": 10}),
        ]

    # Workforce / capacity rules should be probed with toolbar capacity constraints too.
    if "max jobs" in text or "preferred jobs" in text or "workload fairness" in text:
        add("jobs-per-day-tight-5", jobs_per_day=5)
        add("jobs-per-day-rule-15", jobs_per_day=15)
    if "default service hours" in text or "shift" in text or "service hours" in text:
        add("future-full-week", **{})
        add("current-week-exclusions", **BASE_CURRENT)
    if "pre/post" in text or "travel" in text or "drive" in text:
        add("drive-buffer-10", drive_buffer=10)
        add("drive-buffer-30", drive_buffer=30)
    if "max last" in text or "departure" in text or "4pm" in text or "4:00pm" in text:
        add("optimize-to-4pm", optimize_to="2026-08-29T16:00:00+00:00")
        add("optimize-to-end-of-day", optimize_to="2026-08-29T23:59:59+00:00")
    if "preferred tech" in text or "skill" in text or "route around" in text or "do not reroute" in text:
        add("all-statuses", statuses=-1)
        add("no-recurring", inc="")
    if "region" in text or "customer" in text or "arrival window" in text:
        add("color-1-recurring", color_id=1, inc="recurring")
        add("color-all-no-recurring", color_id=None, inc="")
    if "exclude" in text or "lock" in text:
        add("exclude-known", exclude=[6, 0])
        add("no-exclude", exclude=[])
    if "horizon" in text or "freeze" in text or "period" in text:
        add("future-week", **BASE_FUTURE)
        add("current-week", **BASE_CURRENT)

    # Always keep at least one default future payload for every rule scenario.
    add("default-future", **{})

    # Dedupe exact payloads while preserving order.
    seen = set()
    out = []
    for label, f in variants:
        key = json.dumps(f, sort_keys=True)
        if key in seen:
            continue
        seen.add(key)
        out.append((label, f))
    return out[:3]


def load_sources():
    scenarios = []
    for src in SRC_FILES:
        scenarios.extend(json.loads(src.read_text()))
    return scenarios


sources = load_sources()
# Pick balanced, high-signal rules. Avoid old CR-only rows because setup is not automated here.
priority_needles = [
    "control",
    "max jobs", "preferred jobs", "workload fairness",
    "default service hours", "pre/post-shift", "max shift", "day exclusions",
    "minimize travel", "max travel", "max shift travel", "preferred tech", "skill matching",
    "max last", "departure", "arrival window", "region enforcement", "drive buffer", "customer scheduling",
]
selected = []
seen_rule = set()
for needle in priority_needles:
    for sc in sources:
        txt = (sc.get("name", "") + " " + source_text(sc)).lower()
        if needle not in txt:
            continue
        key = sc.get("name")
        if key in seen_rule:
            continue
        if sc.get("config") or needle == "control":
            selected.append(sc)
            seen_rule.add(key)
            break

# Top off from module scenarios with configs, preserving variety.
for sc in sources:
    if len(selected) >= 40:
        break
    if sc.get("name") in seen_rule or not sc.get("config"):
        continue
    selected.append(sc)
    seen_rule.add(sc.get("name"))

out = []
for sc in selected:
    for label, filters in variants_for(sc):
        clone = dict(sc)
        clone["name"] = f"r{len(out):03d}-{slug(label + '-' + sc['name'])}"
        clone["source_scenario"] = sc["name"]
        clone["filter_variant"] = label
        clone["filters"] = filters
        out.append(clone)

OUT.write_text(json.dumps(out, indent=2) + "\n")
summary = {
    "out": str(OUT),
    "source_scenarios": len(selected),
    "business_scenarios": len(out),
    "first": out[0]["name"] if out else None,
    "last": out[-1]["name"] if out else None,
}
print(json.dumps(summary, indent=2))
