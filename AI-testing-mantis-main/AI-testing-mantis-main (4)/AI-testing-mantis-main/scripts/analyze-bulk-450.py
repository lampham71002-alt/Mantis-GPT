#!/usr/bin/env python3
import collections
import json
import math
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "captures"
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)
SCENARIOS = json.loads((ROOT / "scripts/bulk-450-system-filter-scenarios.json").read_text())
SCENARIOS_BY_NAME = {s["name"]: s for s in SCENARIOS}
MATRIX = [r for r in json.loads((CAPTURES / "matrix-results.json").read_text()) if str(r.get("name", "")).startswith("b")]
RESULTS = {r["name"]: r for r in MATRIX}

# Endpoint fields from .agents/skills/mantis-routing/rules-catalog.md.
VALID_FIELDS = {
    "system-rules": {
        "auto_optimization", "freeze_window_days", "optimization_horizon",
        "job_movement_restriction_days", "preserve_original_period", "allow_cross_technician_routing",
    },
    "workforce-boundaries": {
        "default_service_hours", "max_jobs_per_day", "preferred_jobs_per_day",
        "shift_travel_minutes", "max_shift_end_time", "workload_balance", "day_exclusions",
        "overtime_protection_enabled",
    },
    "route-efficiency": {
        "minimize_travel_time_minutes", "minimize_travel_distance_miles", "max_travel_distance_miles",
        "max_shift_travel_time_minutes", "do_not_reroute_statuses", "route_around_statuses",
        "preferred_tech_matching", "tech_skill_matching",
    },
    "service-commitment": {
        "max_departure_time", "arrival_window_hours", "region_enforcement",
        "customer_scheduling_preferences", "drive_buffer",
    },
}
BARE_FLAGS = {
    ("system-rules", "allow_cross_technician_routing"),
    ("workforce-boundaries", "workload_balance"),
    ("route-efficiency", "tech_skill_matching"),
    ("service-commitment", "customer_scheduling_preferences"),
}


def parse_ndjson(path: Path):
    chunks = []
    if not path.exists():
        return chunks
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            chunks.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return chunks


def jobs(chunks, scope):
    out = {}
    for c in chunks:
        if c.get("type") == "jobs" and c.get("scope") == scope:
            for j in c.get("data", []):
                jid = str(j.get("job", {}).get("id"))
                out[jid] = {
                    "start": j.get("event", {}).get("start"),
                    "end": j.get("event", {}).get("end"),
                    "schedule": str(j.get("schedule", {}).get("id")),
                    "length": j.get("event", {}).get("length"),
                    "day": j.get("date_label"),
                    "status": j.get("job", {}).get("status"),
                    "locked": j.get("job", {}).get("locked") or j.get("event", {}).get("locked"),
                }
    return out


def segs(chunks, kind, scope):
    out = []
    for c in chunks:
        if c.get("type") == kind and c.get("scope") == scope:
            out.extend(c.get("data", []))
    return out


def stats_total(chunks):
    for c in chunks:
        if c.get("type") == "stats" and c.get("scope") == "total":
            return c.get("data", {})
    return {}


def get_stats_metric(st, key):
    item = st.get(key, {})
    return (item.get("before", {}) or {}).get("value"), (item.get("after", {}) or {}).get("value")


def get_work_metric(st):
    tr = st.get("time_ratio", {})
    wt = tr.get("work_time", {}) if isinstance(tr, dict) else {}
    return (wt.get("before", {}) or {}).get("value"), (wt.get("after", {}) or {}).get("value")


def mins(iso):
    if not iso or "T" not in iso:
        return None
    t = iso.split("T", 1)[1]
    return int(t[:2]) * 60 + int(t[3:5])


def config_issues(name, capture):
    sc = SCENARIOS_BY_NAME[name]
    issues = []
    if not capture:
        return issues
    p = CAPTURES / capture / "config-applied.json"
    applied = json.loads(p.read_text()) if p.exists() else {}
    for endpoint, patch in sc.get("config", {}).items():
        got = applied.get(endpoint, {})
        for key, expected in patch.items():
            if key not in VALID_FIELDS.get(endpoint, set()):
                issues.append({"endpoint": endpoint, "field": key, "type": "unknown_field_in_payload"})
                continue
            if key not in got:
                issues.append({"endpoint": endpoint, "field": key, "type": "missing_in_readback"})
                continue
            actual = got[key]
            if (endpoint, key) in BARE_FLAGS:
                # bare fields should be 0/1, not {status,value}
                expected_on = expected if isinstance(expected, int) else expected.get("value") if isinstance(expected, dict) else expected
                if bool(actual) != bool(expected_on):
                    issues.append({"endpoint": endpoint, "field": key, "type": "bare_flag_value_mismatch", "actual": actual, "expected": expected})
            else:
                if isinstance(expected, dict) and "status" in expected:
                    if not isinstance(actual, dict) or actual.get("status") != expected.get("status") or actual.get("value") != expected.get("value"):
                        issues.append({"endpoint": endpoint, "field": key, "type": "value_mismatch", "actual": actual, "expected": expected})
                else:
                    if actual != expected:
                        issues.append({"endpoint": endpoint, "field": key, "type": "value_mismatch", "actual": actual, "expected": expected})
    return issues


success = []
errors = []
analysis_rows = []
error_counter = collections.Counter()
setup_issue_counter = collections.Counter()
field_issue_counter = collections.Counter()
contract_counter = collections.Counter()
filter_counter = collections.Counter()
core_changed = []
strict_violations = []
job_moved_rows = []
setup_valid_success = []

control_future = RESULTS.get("b000-control-future", {})
control_current = RESULTS.get("b001-control-current", {})

for sc in SCENARIOS:
    name = sc["name"]
    r = RESULTS.get(name, {"name": name, "error": "missing result"})
    if r.get("error"):
        errors.append(r)
        msg = r.get("error", "")
        error_counter[msg] += 1
        analysis_rows.append({"name": name, "verdict": "CONFIG_REJECTED", "error": msg})
        continue
    success.append(r)
    capture = r.get("capture")
    chunks = parse_ndjson(CAPTURES / capture / "optimize.ndjson")
    jb, jo = jobs(chunks, "before"), jobs(chunks, "optimized")
    db, do = segs(chunks, "drive_time", "before"), segs(chunks, "drive_time", "optimized")
    st = stats_total(chunks)
    work_stat = get_work_metric(st)
    drive_stat = get_stats_metric(st, "drive_time")
    dist_stat = get_stats_metric(st, "distance")
    job_stat = get_stats_metric(st, "jobs_assigned")
    before_work_sum = sum((j.get("length") or 0) for j in jb.values())
    opt_work_sum = sum((j.get("length") or 0) for j in jo.values())
    before_drive_sum = round(sum(float(s.get("value") or 0) for s in db), 1)
    opt_drive_sum = round(sum(float(s.get("value") or 0) for s in do), 1)
    placements_same = jb == jo
    ids_same = set(jb) == set(jo)
    moved = [jid for jid in jb if jid in jo and jb[jid] != jo[jid]]
    missing = sorted(set(jb) - set(jo))
    added = sorted(set(jo) - set(jb))
    cfg_issues = config_issues(name, capture)
    for i in cfg_issues:
        setup_issue_counter[i["type"]] += 1
        field_issue_counter[(i["endpoint"], i["field"], i["type"])] += 1
    if not cfg_issues:
        setup_valid_success.append(name)
    # contract findings
    if placements_same:
        contract_counter["jobs_optimized_identical_to_before"] += 1
    if not ids_same:
        contract_counter["job_id_set_changed"] += 1
    if missing:
        contract_counter["jobs_missing_from_optimized"] += 1
    if added:
        contract_counter["new_jobs_in_optimized"] += 1
    if not moved:
        contract_counter["zero_moved_jobs"] += 1
    else:
        job_moved_rows.append((name, len(moved)))
    if job_stat[1] != len(jo):
        contract_counter["stats_jobs_assigned_mismatch_count"] += 1
    if work_stat[0] != before_work_sum:
        contract_counter["stats_before_work_mismatch"] += 1
    if work_stat[1] != opt_work_sum:
        contract_counter["stats_after_work_mismatch"] += 1
    # Do not require exact drive stats because API currently appears to mix units, but record mismatch.
    if drive_stat[0] != before_drive_sum or drive_stat[1] != opt_drive_sum:
        contract_counter["stats_drive_mismatch_raw_segments"] += 1
    # filter/rule specific checks we can safely assert from request body, independent of unknown config.
    body = json.loads((CAPTURES / capture / "request.json").read_text()) if (CAPTURES / capture / "request.json").exists() else {}
    if "jobs_per_day" in body:
        cap = int(body["jobs_per_day"])
        filter_counter[f"jobs_per_day_{cap}"] += 1
        if r.get("max_jobs_one_day", 0) > cap:
            strict_violations.append({"name": name, "filter": "jobs_per_day", "expected_max": cap, "observed_max_day": r.get("max_jobs_one_day"), "capture": capture})
    if "drive_buffer" in body:
        filter_counter[f"drive_buffer_{body['drive_buffer']}"] += 1
    # core metric changed from relevant control
    ctrl = control_current if body.get("start") == "2026-08-16T00:00:00+00:00" else control_future
    if r.get("drive_sum") != ctrl.get("drive_sum") or r.get("stats_drive") != ctrl.get("stats_drive") or r.get("stats_work") != ctrl.get("stats_work"):
        core_changed.append(name)
    analysis_rows.append({
        "name": name,
        "capture": capture,
        "setup_valid": not cfg_issues,
        "setup_issues": cfg_issues,
        "jobs_before": len(jb),
        "jobs_optimized": len(jo),
        "placements_same": placements_same,
        "moved_jobs": len(moved),
        "missing_jobs": len(missing),
        "added_jobs": len(added),
        "before_work_sum": before_work_sum,
        "optimized_work_sum": opt_work_sum,
        "stats_work": work_stat,
        "before_drive_sum": before_drive_sum,
        "optimized_drive_sum": opt_drive_sum,
        "stats_drive": drive_stat,
        "stats_distance": dist_stat,
        "stats_jobs_assigned": job_stat,
        "max_jobs_one_day": r.get("max_jobs_one_day"),
        "request": body,
    })

# Error categories compacted.
def categorize_error(msg):
    if "max_departure_time value must be an integer" in msg:
        return "max_departure_time wrong type (HH:MM sent; API requires minutes 0-1439)"
    if "customer_scheduling_preferences is invalid" in msg:
        return "customer_scheduling_preferences wrong payload (bare 0/1 expected)"
    if "Workload Fairness must be turned on or off" in msg:
        return "workload_balance wrong payload (bare 0/1 expected)"
    return msg

err_cat = collections.Counter(categorize_error(e.get("error", "")) for e in errors)

# Correctness verdicts for successful captures.
valid_and_no_contract_blocker = [row for row in analysis_rows if row.get("capture") and row["setup_valid"] and not row["placements_same"] and row["moved_jobs"]]
valid_setup = [row for row in analysis_rows if row.get("capture") and row["setup_valid"]]
invalid_setup = [row for row in analysis_rows if row.get("capture") and not row["setup_valid"]]

# Top changed metrics examples.
changed_examples = []
for name in core_changed[:40]:
    r = RESULTS[name]
    changed_examples.append({
        "name": name,
        "capture": r.get("capture"),
        "drive_sum": r.get("drive_sum"),
        "stats_work": r.get("stats_work"),
        "stats_drive": r.get("stats_drive"),
        "max_jobs_one_day": r.get("max_jobs_one_day"),
    })

summary = {
    "generated_at": datetime.now().isoformat(timespec="seconds"),
    "total_scenarios": len(SCENARIOS),
    "matrix_results": len(MATRIX),
    "successful_optimize_captures": len(success),
    "config_rejected": len(errors),
    "estimated_api_calls_range": {"min": 3258, "max": 3644},
    "setup_valid_successes": len(valid_setup),
    "setup_invalid_successes": len(invalid_setup),
    "valid_success_with_actual_placement_change": len(valid_and_no_contract_blocker),
    "core_metric_changed_count": len(core_changed),
    "contract_counter": dict(contract_counter),
    "error_categories": dict(err_cat),
    "setup_issue_counter": dict(setup_issue_counter),
    "top_setup_field_issues": [
        {"endpoint": k[0], "field": k[1], "issue": k[2], "count": v}
        for k, v in field_issue_counter.most_common(30)
    ],
    "filter_counter": dict(filter_counter),
    "jobs_per_day_violations_count": len(strict_violations),
    "jobs_per_day_violations_sample": strict_violations[:20],
    "core_changed_sample": changed_examples,
    "rows": analysis_rows,
}
(REPORTS / "bulk-450-analysis.json").write_text(json.dumps(summary, indent=2))

# Markdown report
lines = []
lines.append("# Mantis Routing Bulk 450 API Verification — Detailed Analysis")
lines.append("")
lines.append(f"Generated: `{summary['generated_at']}`")
lines.append("")
lines.append("## Executive summary")
lines.append("")
lines.append("| Metric | Value |")
lines.append("|---|---:|")
lines.append(f"| Scenarios in bulk suite | {len(SCENARIOS)} |")
lines.append(f"| Results present | {len(MATRIX)} |")
lines.append(f"| Optimize streams captured | {len(success)} |")
lines.append(f"| Config/API rejected before optimize | {len(errors)} |")
lines.append(f"| Estimated API calls | {summary['estimated_api_calls_range']['min']}–{summary['estimated_api_calls_range']['max']} |")
lines.append(f"| Successful captures with requested config read back correctly | {len(valid_setup)} |")
lines.append(f"| Successful captures with setup mismatch / unknown ignored fields | {len(invalid_setup)} |")
lines.append(f"| Successful captures with actual job placement changes | {len(valid_and_no_contract_blocker)} |")
lines.append(f"| Captures with core metric changed vs control | {len(core_changed)} |")
lines.append("")
lines.append("**Bottom line:** the run did exercise >3k API calls and produced raw evidence, but it does **not** prove most System Rule correctness yet. The dominant blocker is response/setup quality: many generated rule payload fields used non-contract names or wrong value shapes, and every successful optimize stream returned `jobs_optimized` with the same placement as `jobs_before` (`jobs_moved=0`). That prevents proving whether the optimizer placed jobs correctly under hard rules.")
lines.append("")
lines.append("## APIs actually exercised")
lines.append("")
lines.append("### Bulk 450")
lines.append("- `PUT /routing/system-rules` — restore before every scenario; scenario setup when present")
lines.append("- `PUT /routing/workforce-boundaries` — restore before every scenario; scenario setup when present")
lines.append("- `PUT /routing/route-efficiency` — restore before every scenario; scenario setup when present")
lines.append("- `PUT /routing/service-commitment` — restore before every scenario; scenario setup when present")
lines.append("- `GET /routing/<rule-endpoint>` — read-back into `config-applied.json` for successful setup endpoints")
lines.append("- `PUT /routing/mantis/manual/optimize` — raw NDJSON captured for successful scenarios")
lines.append("")
lines.append("### Sandbox / feeds batch already captured")
lines.append("- `GET /routing/mantis/autopilot/jobs`")
lines.append("- `GET /routing/mantis/autopilot/routes`")
lines.append("- `PUT /routing/mantis/manual/optimize`")
lines.append("- `GET /routing/mantis/feeds/history`")
lines.append("- `GET /routing/mantis/feeds/errors`")
lines.append("- `GET /routing/mantis/feeds/errors/count`")
lines.append("- `GET /routing/mantis/feeds/history/:id/logs`")
lines.append("")
lines.append("## Response contract findings")
lines.append("")
lines.append("| Check | Count | Interpretation |")
lines.append("|---|---:|---|")
for key in ["jobs_optimized_identical_to_before", "zero_moved_jobs", "stats_after_work_mismatch", "stats_drive_mismatch_raw_segments", "stats_jobs_assigned_mismatch_count"]:
    lines.append(f"| `{key}` | {contract_counter.get(key,0)} / {len(success)} | {'Blocks placement assertions' if key in ['jobs_optimized_identical_to_before','zero_moved_jobs'] else 'Internal response inconsistency'} |")
lines.append("")
lines.append("### What this means for optimized jobs")
lines.append("")
lines.append("Across all successful optimize captures, the stream reports the same job placements before and after. `jobs_moved=0` for all successful captures. Therefore, for hard placement rules — service hours, max shift end, max departure, max travel, strict region/tech/skill, etc. — we **cannot** honestly mark PASS. The optimized job list does not show moves, drops, or reassignments needed to prove compliance.")
lines.append("")
lines.append("There are also internal mismatches: `stats.time_ratio.work_time.after` is often `0` while 212 optimized jobs still exist with non-zero event lengths, and raw `drive_time` segment sums do not match `stats.drive_time`. Those contradictions mean stats cannot be treated as the sole source of truth.")
lines.append("")
lines.append("## Setup / payload findings")
lines.append("")
lines.append("Many successful scenarios were not valid rule tests because BE accepted the PUT but read-back shows the requested key was ignored or remained disabled.")
lines.append("")
lines.append("| Issue | Count |")
lines.append("|---|---:|")
for k,v in setup_issue_counter.most_common():
    lines.append(f"| `{k}` | {v} |")
lines.append("")
lines.append("### Most common field issues")
lines.append("")
lines.append("| Endpoint | Field sent | Issue | Count | Correct key/shape from catalog |")
lines.append("|---|---|---|---:|---|")
correct = {
    ("system-rules","restrict_movement_window"): "`job_movement_restriction_days`",
    ("system-rules","preserve_original_week"): "`preserve_original_period`",
    ("system-rules","cross_technician_routing"): "`allow_cross_technician_routing` bare 0/1",
    ("workforce-boundaries","service_hours"): "`default_service_hours`: `{system_default,start,end}`",
    ("workforce-boundaries","max_shift_travel_time"): "`shift_travel_minutes`",
    ("route-efficiency","minimize_travel_time"): "`minimize_travel_time_minutes`",
    ("route-efficiency","minimize_distance"): "`minimize_travel_distance_miles`",
    ("route-efficiency","max_travel_distance"): "`max_travel_distance_miles`",
    ("route-efficiency","max_shift_travel_time"): "`max_shift_travel_time_minutes`",
    ("route-efficiency","preferred_technician"): "`preferred_tech_matching`: `soft|strict`",
    ("route-efficiency","technician_skill_matching"): "`tech_skill_matching` bare 0/1",
    ("service-commitment","region_matching"): "`region_enforcement`: `soft|strict`",
    ("service-commitment","drive_time_buffer"): "`drive_buffer`",
    ("service-commitment","max_departure_time"): "minutes from midnight integer, e.g. `960`",
    ("service-commitment","customer_scheduling_preferences"): "bare `0|1`, not `{status,value}`",
    ("workforce-boundaries","workload_balance"): "bare `0|1`, not `{status,value}`",
}
for item in summary["top_setup_field_issues"][:24]:
    c = correct.get((item["endpoint"], item["field"]), "see rules-catalog.md")
    lines.append(f"| `{item['endpoint']}` | `{item['field']}` | `{item['issue']}` | {item['count']} | {c} |")
lines.append("")
lines.append("## Config rejection categories")
lines.append("")
lines.append("| Category | Count |")
lines.append("|---|---:|")
for k,v in err_cat.most_common():
    lines.append(f"| {k} | {v} |")
lines.append("")
lines.append("## Jobs-per-day and drive-buffer findings")
lines.append("")
lines.append(f"- `jobs_per_day` toolbar scenarios executed: {sum(v for k,v in filter_counter.items() if k.startswith('jobs_per_day_'))}")
lines.append(f"- Jobs-per-day violations observed: {len(strict_violations)}. Example: max/day stayed at `36` while request set `jobs_per_day=1/5/15` in future week, or stayed `32` in current week.")
lines.append("- `drive_buffer` toolbar scenarios clearly affected drive metrics: future week `drive_buffer=10` changed raw drive `3798.5 → 4375.1`; `drive_buffer=30` changed `3798.5 → 5284.0`; current week `drive_buffer=10` changed `1199.1 → 1591.8`.")
lines.append("- System-level `drive_buffer` scenarios in this bulk run did **not** apply because the generated payload sent `drive_time_buffer`, while the API key is `drive_buffer`.")
lines.append("")
if strict_violations:
    lines.append("### Jobs-per-day violation sample")
    lines.append("")
    lines.append("| Scenario | Capture | Expected max/day | Observed max/day |")
    lines.append("|---|---|---:|---:|")
    for v in strict_violations[:12]:
        lines.append(f"| `{v['name']}` | `{v['capture']}` | {v['expected_max']} | {v['observed_max_day']} |")
    lines.append("")
lines.append("## Can we say the optimized jobs are correct?")
lines.append("")
lines.append("**No, not yet.** Based on the API responses, we cannot prove the jobs are correctly optimized against rules, because:")
lines.append("")
lines.append("1. The optimized job placements are identical to before in every successful capture (`jobs_moved=0`).")
lines.append("2. Several response chunks contradict each other (`jobs` vs `stats.work_time`, `drive_time` vs `stats.drive_time`).")
lines.append("3. Many intended System Rule setups were not actually active due to wrong keys/shapes; read-back proves this.")
lines.append("4. `manual/optimize` preview does not write explainability feeds, so reasons are unavailable unless we `manual/accept` and then read history/logs/undo.")
lines.append("")
lines.append("What we **can** say:")
lines.append("")
lines.append("- The manual optimize endpoint is stable enough to stream 292 optimize responses in this run.")
lines.append("- Toolbar `drive_buffer` reaches the engine and changes drive metrics.")
lines.append("- Toolbar `jobs_per_day` did not enforce the requested cap in captured results.")
lines.append("- Current payload generator must be corrected before using this bulk run as proof of System Rule correctness.")
lines.append("")
lines.append("## Evidence paths")
lines.append("")
lines.append("- Raw matrix: `captures/matrix-results.json`")
lines.append("- Runner logs: `captures/bulk-450-260822-114053.log`, `captures/bulk-450-260822-114053.err`")
lines.append("- Per-scenario evidence: `captures/<timestamp>-<scenario>/request.json`, `config-applied.json`, `optimize.ndjson`, `summary.json`")
lines.append("- Machine-readable analysis: `reports/bulk-450-analysis.json`")
lines.append("")
lines.append("## Next concrete actions")
lines.append("")
lines.append("1. Commit/push all remaining raw captures + this report.")
lines.append("2. Patch the bulk generator to use exact keys from `rules-catalog.md` and minutes-from-midnight for time fields.")
lines.append("3. Run a smaller corrected 40–60 scenario suite first to verify setup read-back is correct for every module.")
lines.append("4. For true hard-rule proof, run accept/feeds/undo cases so `reasons[]` can validate why jobs moved/dropped.")

(REPORTS / "bulk-450-detailed-analysis.md").write_text("\n".join(lines) + "\n")
print(json.dumps({k: summary[k] for k in ['total_scenarios','successful_optimize_captures','config_rejected','estimated_api_calls_range','setup_valid_successes','setup_invalid_successes','valid_success_with_actual_placement_change','core_metric_changed_count']}, indent=2))
print(REPORTS / "bulk-450-detailed-analysis.md")
print(REPORTS / "bulk-450-analysis.json")
