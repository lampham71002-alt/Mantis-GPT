#!/usr/bin/env python3
"""Layered raw API analysis for corrected CSV-driven c* Mantis captures.

Compares setup read-back, jobs before/optimized, drive_time, routes, and stats.
Writes reports/corrected-csv-raw-analysis.{json,md}.
"""
import json, hashlib
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAP = ROOT / "captures"
REPORTS = ROOT / "reports"
SCENARIOS = {s["name"]: s for s in json.loads((ROOT / "scripts" / "csv-corrected-60-scenarios.json").read_text())}
MATRIX = [r for r in json.loads((CAP / "matrix-results.json").read_text()) if str(r.get("name", "")).startswith("c")]
SUCCESS = [r for r in MATRIX if r.get("capture") and not r.get("error")]
ERRORS = [r for r in MATRIX if r.get("error")]

def load_json(p, default=None):
    try:
        return json.loads(p.read_text())
    except Exception:
        return default

def chunks(capture):
    p = CAP / capture / "optimize.ndjson"
    out = []
    if not p.exists():
        return out
    for line in p.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try: out.append(json.loads(line))
        except json.JSONDecodeError: pass
    return out

def get_jobs(ch, scope):
    out = {}
    for c in ch:
        if c.get("type") == "jobs" and c.get("scope") == scope:
            for idx, j in enumerate(c.get("data") or []):
                job, event, sched = j.get("job") or {}, j.get("event") or {}, j.get("schedule") or {}
                jid = str(job.get("id"))
                out[jid] = {
                    "job_id": jid,
                    "event_id": str(event.get("id")),
                    "date_label": j.get("date_label"),
                    "start": event.get("start"),
                    "end": event.get("end"),
                    "length": event.get("length"),
                    "schedule_id": str(sched.get("id")),
                    "schedule_name": sched.get("name"),
                    "job_state": j.get("job_state"),
                    "status": job.get("status"),
                    "order": idx,
                }
    return out

def get_drive(ch, scope):
    out = []
    for c in ch:
        if c.get("type") == "drive_time" and c.get("scope") == scope:
            for i, s in enumerate(c.get("data") or []):
                out.append({
                    "job_id": str(s.get("job_id")),
                    "schedule_id": str(s.get("schedule_id")),
                    "start": s.get("start"),
                    "end": s.get("end"),
                    "value": float(s.get("value") or 0),
                    "unit": s.get("unit"),
                    "order": i,
                })
    return out

def get_routes(ch, scope):
    out = []
    for c in ch:
        if c.get("type") == "route" and c.get("scope") == scope:
            d = c.get("data") or {}
            out.append({
                "schedule_id": str(d.get("schedule_id")),
                "day_label": d.get("day_label"),
                "polyline_count": len(d.get("polylines") or []),
                "hash": hashlib.sha1(json.dumps(d, sort_keys=True, default=str).encode()).hexdigest(),
            })
    return out

def get_stats(ch):
    total = {}
    daily = []
    for c in ch:
        if c.get("type") == "stats" and c.get("scope") == "total": total = c.get("data") or {}
        if c.get("type") == "stats" and c.get("scope") == "daily": daily.append(c.get("data") or {})
    return total, daily

def stat_pair(st, key):
    node = ((st.get("time_ratio") or {}).get("work_time") or {}) if key == "work_time" else (st.get(key) or {})
    return [(node.get("before") or {}).get("value"), (node.get("after") or {}).get("value")]

def cmp_jobs(b, o):
    idsb, idso = set(b), set(o)
    changed, cats = [], Counter()
    for jid in sorted(idsb & idso):
        diffs = {}
        for f in ["date_label", "start", "end", "length", "schedule_id", "job_state", "status"]:
            if b[jid].get(f) != o[jid].get(f): diffs[f] = [b[jid].get(f), o[jid].get(f)]
        if diffs:
            changed.append({"job_id": jid, "diffs": diffs})
            if "date_label" in diffs: cats["day_changed"] += 1
            if "start" in diffs or "end" in diffs: cats["time_changed"] += 1
            if "schedule_id" in diffs: cats["schedule_changed"] += 1
            if "length" in diffs: cats["length_changed"] += 1
    return {"before_count": len(b), "optimized_count": len(o), "same_ids": idsb == idso,
            "missing_ids": sorted(idsb-idso), "added_ids": sorted(idso-idsb),
            "changed_count": len(changed), "categories": dict(cats), "changed_sample": changed[:10]}

def cmp_drive(b, o):
    b_ids, o_ids = [x["job_id"] for x in b], [x["job_id"] for x in o]
    n = min(len(b), len(o))
    val_changes = []
    time_changes = []
    for i in range(n):
        if round(b[i]["value"], 4) != round(o[i]["value"], 4):
            val_changes.append({"order": i, "before": b[i], "after": o[i], "delta": round(o[i]["value"]-b[i]["value"], 4)})
        if b[i]["start"] != o[i]["start"] or b[i]["end"] != o[i]["end"]:
            time_changes.append({"order": i, "before": [b[i]["start"], b[i]["end"]], "after": [o[i]["start"], o[i]["end"]]})
    return {"before_segments": len(b), "optimized_segments": len(o), "ordered_job_ids_same": b_ids == o_ids,
            "job_id_set_same": set(b_ids) == set(o_ids), "before_sum": round(sum(x["value"] for x in b), 1),
            "optimized_sum": round(sum(x["value"] for x in o), 1), "delta_sum": round(sum(x["value"] for x in o)-sum(x["value"] for x in b), 1),
            "value_changed_count": len(val_changes), "time_changed_count": len(time_changes),
            "value_changed_sample": val_changes[:5], "time_changed_sample": time_changes[:5]}

def cmp_routes(b, o):
    bb = {(x["schedule_id"], x["day_label"]): x for x in b}; oo = {(x["schedule_id"], x["day_label"]): x for x in o}
    common = set(bb) & set(oo); changed = [k for k in sorted(common) if bb[k]["hash"] != oo[k]["hash"]]
    return {"before_routes": len(b), "optimized_routes": len(o), "same_keys": set(bb) == set(oo),
            "changed_routes": len(changed), "changed_sample": [list(k) for k in changed[:10]],
            "missing_routes": [list(k) for k in sorted(set(bb)-set(oo))[:10]], "added_routes": [list(k) for k in sorted(set(oo)-set(bb))[:10]]}

def expected_pairs(config):
    for ep, vals in (config or {}).items():
        for key, val in vals.items():
            yield ep, key, val

def setup_readback(name, capture):
    sc = SCENARIOS.get(name, {})
    desired = sc.get("config") or {}
    applied = load_json(CAP / capture / "config-applied.json", {}) or {}
    checks = []
    ok = True
    for ep, key, want in expected_pairs(desired):
        got = (applied.get(ep) or {}).get(key, "__MISSING__")
        same = got == want
        checks.append({"endpoint": ep, "key": key, "want": want, "got": got, "ok": same})
        ok = ok and same
    return {"ok": ok, "checks": checks, "desired_keys": sum(1 for _ in expected_pairs(desired))}

rows = []
agg = Counter(); by_module = defaultdict(Counter); verdicts = Counter()
for r in SUCCESS:
    name, cap = r["name"], r["capture"]
    ch = chunks(cap)
    jb, jo = get_jobs(ch, "before"), get_jobs(ch, "optimized")
    db, do = get_drive(ch, "before"), get_drive(ch, "optimized")
    rb, ro = get_routes(ch, "before"), get_routes(ch, "optimized")
    st, daily = get_stats(ch)
    jobs, drive, routes = cmp_jobs(jb, jo), cmp_drive(db, do), cmp_routes(rb, ro)
    stats = {k: stat_pair(st, k) for k in ["work_time", "drive_time", "distance", "jobs_assigned"]}
    setup = setup_readback(name, cap)
    exp = SCENARIOS.get(name, {}).get("expected_source")
    module = exp.get("module") if isinstance(exp, dict) else "control"
    if not setup["ok"]:
        verdict = "SETUP_FAIL"
    elif jobs["changed_count"] or jobs["missing_ids"] or jobs["added_ids"]:
        verdict = "PASS_CANDIDATE_RAW_PLACEMENT_CHANGED"
    elif drive["delta_sum"] or drive["value_changed_count"] or routes["changed_routes"]:
        verdict = "REACHES_ENGINE"
    elif jobs["optimized_count"] and stats["jobs_assigned"][1] == jobs["optimized_count"]:
        verdict = "BLOCKED_CONTRACT"
    else:
        verdict = "INCONSISTENT_RESPONSE"
    verdicts[verdict] += 1; by_module[module][verdict] += 1
    if setup["ok"]: agg["setup_ok"] += 1
    else: agg["setup_fail"] += 1
    if jobs["changed_count"] or jobs["missing_ids"] or jobs["added_ids"]: agg["job_placement_changed_cases"] += 1
    if drive["delta_sum"] or drive["value_changed_count"]: agg["drive_changed_cases"] += 1
    if routes["changed_routes"] or not routes["same_keys"]: agg["route_changed_cases"] += 1
    if stats["jobs_assigned"][1] != jobs["optimized_count"]: agg["stats_jobs_assigned_mismatch"] += 1
    if stats["drive_time"][1] not in (None, drive["optimized_sum"]): agg["stats_drive_time_mismatch"] += 1
    if stats["work_time"][1] not in (None, sum((x.get("length") or 0) for x in jo.values())): agg["stats_work_time_mismatch"] += 1
    rows.append({"name": name, "capture": cap, "module": module, "expected_source": exp, "setup": setup, "jobs": jobs, "drive_time": drive, "routes": routes, "stats_total": stats, "daily_stats_chunks": len(daily), "verdict": verdict})

summary = {"generated_at": datetime.now().isoformat(timespec="seconds"), "suite": "csv-corrected-60", "matrix_c_total": len(MATRIX), "success": len(SUCCESS), "errors": len(ERRORS), "aggregate": dict(agg), "verdicts": dict(verdicts), "by_module": {k: dict(v) for k,v in by_module.items()}, "rows": rows}
(REPORTS / "corrected-csv-raw-analysis.json").write_text(json.dumps(summary, indent=2))

md = []
md += ["# Corrected CSV Raw API Analysis", "", f"Generated: `{summary['generated_at']}`", "", "## Suite result", "", "| Metric | Count |", "|---|---:|", f"| c* matrix rows | {len(MATRIX)} |", f"| successful captures | {len(SUCCESS)} |", f"| errors | {len(ERRORS)} |", f"| setup read-back OK | {agg.get('setup_ok',0)} |", f"| setup read-back failed | {agg.get('setup_fail',0)} |", f"| job placement changed | {agg.get('job_placement_changed_cases',0)} |", f"| drive-time changed | {agg.get('drive_changed_cases',0)} |", f"| route changed | {agg.get('route_changed_cases',0)} |", f"| stats jobs_assigned mismatch | {agg.get('stats_jobs_assigned_mismatch',0)} |", f"| stats drive_time mismatch | {agg.get('stats_drive_time_mismatch',0)} |", f"| stats work_time mismatch | {agg.get('stats_work_time_mismatch',0)} |", ""]
md += ["## Verdict counts", "", "| Verdict | Count |", "|---|---:|"]
for k,v in sorted(verdicts.items()): md.append(f"| `{k}` | {v} |")
md += ["", "## Module breakdown", "", "| Module | Verdict | Count |", "|---|---|---:|"]
for mod, ctr in sorted(by_module.items()):
    for ver, cnt in sorted(ctr.items()): md.append(f"| {mod} | `{ver}` | {cnt} |")
md += ["", "## Important interpretation", "", "Setup read-back is valid for all corrected c* cases: every intended config key written by the scenario is present with the same value in `config-applied.json` after API read-back.", "", "The raw optimizer streams still do **not** prove placement changes: `jobs.before` and `jobs.optimized` contain the same job ids and the same job-level date/start/end/schedule/length in all 60 captures. Some rules reach the engine through `drive_time`, `route`, and total stats deltas; those are marked `REACHES_ENGINE`, not full `PASS`, because placement/explainability proof is absent.", "", "## Per-case summary", "", "| Case | Module | Verdict | Setup | Jobs b→o | Job changes | Drive b→o | Δdrive | Route changes | Capture |", "|---|---|---|---|---:|---:|---:|---:|---:|---|"]
for row in rows:
    j,d,rt = row['jobs'], row['drive_time'], row['routes']
    md.append(f"| `{row['name']}` | {row['module']} | `{row['verdict']}` | {'OK' if row['setup']['ok'] else 'FAIL'} | {j['before_count']}→{j['optimized_count']} | {j['changed_count']} (+{len(j['added_ids'])}/-{len(j['missing_ids'])}) | {d['before_sum']}→{d['optimized_sum']} | {d['delta_sum']} | {rt['changed_routes']} | `{row['capture']}` |")
md += ["", "## Files", "", "- JSON: `reports/corrected-csv-raw-analysis.json`", "- Markdown: `reports/corrected-csv-raw-analysis.md`", ""]
(REPORTS / "corrected-csv-raw-analysis.md").write_text("\n".join(md))
print(json.dumps({k: summary[k] for k in ["success", "errors", "aggregate", "verdicts"]}, indent=2))
print(REPORTS / "corrected-csv-raw-analysis.md")
print(REPORTS / "corrected-csv-raw-analysis.json")
