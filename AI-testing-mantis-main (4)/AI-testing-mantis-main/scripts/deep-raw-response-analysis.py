#!/usr/bin/env python3
"""Deep raw-response analysis for Mantis route optimizer captures.

Reads every successful bulk capture and compares API-returned chunks directly:
- jobs before vs optimized (job-level, supports day/time/schedule changes, additions/removals)
- drive_time before vs optimized (segment values/times/job ids)
- route before vs optimized (per-day route polyline payload equality)
- stats consistency
Also reads data/module-rules-testcases.csv and data/cross-module-combos.csv as expected-case corpus.
"""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAP = ROOT / "captures"
DATA = ROOT / "data"
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)

MATRIX = [r for r in json.loads((CAP / "matrix-results.json").read_text()) if str(r.get("name", "")).startswith("b")]
SUCCESS = [r for r in MATRIX if not r.get("error") and r.get("capture")]
ERRORS = [r for r in MATRIX if r.get("error")]

def read_csv(name):
    p = DATA / name
    with p.open(newline="") as f:
        return list(csv.DictReader(f))

MODULE_CASES = read_csv("module-rules-testcases.csv")
CROSS_CASES = read_csv("cross-module-combos.csv")


def chunks(capture):
    p = CAP / capture / "optimize.ndjson"
    out = []
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return out


def get_jobs(chunks_, scope):
    out = {}
    for c in chunks_:
        if c.get("type") == "jobs" and c.get("scope") == scope:
            for idx, j in enumerate(c.get("data", [])):
                job = j.get("job") or {}
                event = j.get("event") or {}
                schedule = j.get("schedule") or {}
                jid = str(job.get("id"))
                out[jid] = {
                    "job_id": jid,
                    "event_id": str(event.get("id")),
                    "start": event.get("start"),
                    "end": event.get("end"),
                    "length": event.get("length"),
                    "schedule_id": str(schedule.get("id")),
                    "schedule_name": schedule.get("name"),
                    "date_label": j.get("date_label"),
                    "job_state": j.get("job_state"),
                    "status": job.get("status"),
                    "tech_id": str(schedule.get("technician_id") or schedule.get("tech_id") or schedule.get("id")),
                    "lat": str((j.get("location") or {}).get("lat")),
                    "lng": str((j.get("location") or {}).get("lng")),
                    "chunk_order": len(out),
                    "raw_hash": hashlib.sha1(json.dumps(j, sort_keys=True, default=str).encode()).hexdigest(),
                }
    return out


def get_drive(chunks_, scope):
    out = []
    for c in chunks_:
        if c.get("type") == "drive_time" and c.get("scope") == scope:
            for i, s in enumerate(c.get("data", [])):
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


def get_routes(chunks_, scope):
    out = []
    for c in chunks_:
        if c.get("type") == "route" and c.get("scope") == scope:
            d = c.get("data") or {}
            out.append({
                "schedule_id": str(d.get("schedule_id")),
                "day_label": d.get("day_label"),
                "hash": hashlib.sha1(json.dumps(d, sort_keys=True, default=str).encode()).hexdigest(),
                "polyline_count": len(d.get("polylines") or []),
            })
    return out


def get_stats(chunks_):
    for c in chunks_:
        if c.get("type") == "stats" and c.get("scope") == "total":
            return c.get("data") or {}
    return {}


def stat_pair(st, key):
    if key == "work_time":
        node = (((st.get("time_ratio") or {}).get("work_time") or {}))
    else:
        node = st.get(key) or {}
    return (node.get("before") or {}).get("value"), (node.get("after") or {}).get("value")


def compare_jobs(before, opt):
    ids_b, ids_o = set(before), set(opt)
    common = ids_b & ids_o
    changed = []
    cats = Counter()
    for jid in common:
        b, o = before[jid], opt[jid]
        diffs = {}
        for field in ["start", "end", "length", "schedule_id", "date_label", "status", "job_state"]:
            if b.get(field) != o.get(field):
                diffs[field] = [b.get(field), o.get(field)]
        if diffs:
            changed.append({"job_id": jid, "diffs": diffs})
            if "date_label" in diffs:
                cats["day_changed"] += 1
            if "start" in diffs or "end" in diffs:
                cats["time_changed"] += 1
            if "schedule_id" in diffs:
                cats["schedule_changed"] += 1
            if set(diffs) - {"date_label", "start", "end", "length", "schedule_id"}:
                cats["other_changed"] += 1
    return {
        "before_count": len(before),
        "optimized_count": len(opt),
        "same_ids": ids_b == ids_o,
        "missing_ids": sorted(ids_b - ids_o),
        "added_ids": sorted(ids_o - ids_b),
        "changed_count": len(changed),
        "categories": dict(cats),
        "changed_sample": changed[:10],
    }


def compare_drive(before, opt):
    # Compare by ordered list and by job id multimap, because drive_time segment may repeat per job.
    b_ids = [x["job_id"] for x in before]
    o_ids = [x["job_id"] for x in opt]
    by_key_b = {(x["job_id"], x["schedule_id"], x["order"]): x for x in before}
    by_key_o = {(x["job_id"], x["schedule_id"], x["order"]): x for x in opt}
    common = set(by_key_b) & set(by_key_o)
    value_changed = []
    time_changed = []
    for k in common:
        b, o = by_key_b[k], by_key_o[k]
        if round(b["value"], 4) != round(o["value"], 4):
            value_changed.append({"key": k, "before": b["value"], "after": o["value"], "delta": round(o["value"]-b["value"], 4)})
        if b["start"] != o["start"] or b["end"] != o["end"]:
            time_changed.append({"key": k, "before": [b["start"], b["end"]], "after": [o["start"], o["end"]]})
    return {
        "before_segments": len(before),
        "optimized_segments": len(opt),
        "ordered_job_ids_same": b_ids == o_ids,
        "job_id_set_same": set(b_ids) == set(o_ids),
        "before_sum": round(sum(x["value"] for x in before), 1),
        "optimized_sum": round(sum(x["value"] for x in opt), 1),
        "delta_sum": round(sum(x["value"] for x in opt) - sum(x["value"] for x in before), 1),
        "value_changed_count": len(value_changed),
        "time_changed_count": len(time_changed),
        "value_changed_sample": value_changed[:10],
        "time_changed_sample": time_changed[:10],
    }


def compare_routes(before, opt):
    b = {(x["schedule_id"], x["day_label"]): x for x in before}
    o = {(x["schedule_id"], x["day_label"]): x for x in opt}
    common = set(b) & set(o)
    changed = [k for k in common if b[k]["hash"] != o[k]["hash"]]
    return {
        "before_routes": len(before),
        "optimized_routes": len(opt),
        "same_keys": set(b) == set(o),
        "changed_routes": len(changed),
        "changed_sample": [list(k) for k in changed[:10]],
        "missing_routes": [list(k) for k in sorted(set(b)-set(o))[:10]],
        "added_routes": [list(k) for k in sorted(set(o)-set(b))[:10]],
    }

rows = []
agg = Counter()
changed_jobs_cases = []
changed_drive_cases = []
changed_route_cases = []

for r in SUCCESS:
    ch = chunks(r["capture"])
    jb, jo = get_jobs(ch, "before"), get_jobs(ch, "optimized")
    db, do = get_drive(ch, "before"), get_drive(ch, "optimized")
    rb, ro = get_routes(ch, "before"), get_routes(ch, "optimized")
    st = get_stats(ch)
    jc = compare_jobs(jb, jo)
    dc = compare_drive(db, do)
    rc = compare_routes(rb, ro)
    sp = {"drive_time": stat_pair(st, "drive_time"), "distance": stat_pair(st, "distance"), "jobs_assigned": stat_pair(st, "jobs_assigned"), "work_time": stat_pair(st, "work_time")}
    row = {"name": r["name"], "capture": r["capture"], "jobs": jc, "drive_time": dc, "routes": rc, "stats": sp, "summary_drive_sum": r.get("drive_sum"), "summary_stats_drive": r.get("stats_drive")}
    rows.append(row)
    if jc["changed_count"] or jc["missing_ids"] or jc["added_ids"]:
        agg["job_placement_changed_cases"] += 1
        changed_jobs_cases.append(row)
    if dc["delta_sum"] or dc["value_changed_count"] or not dc["ordered_job_ids_same"]:
        agg["drive_changed_cases"] += 1
        changed_drive_cases.append(row)
    if rc["changed_routes"] or not rc["same_keys"]:
        agg["route_changed_cases"] += 1
        changed_route_cases.append(row)
    if sp["jobs_assigned"][1] != jc["optimized_count"]:
        agg["stats_jobs_assigned_mismatch"] += 1
    if sp["work_time"][1] not in (None, sum(x.get("length") or 0 for x in jo.values())):
        agg["stats_work_time_mismatch"] += 1
    if sp["drive_time"][1] not in (None, dc["optimized_sum"]):
        agg["stats_drive_time_mismatch"] += 1

summary = {
    "generated_at": datetime.now().isoformat(timespec="seconds"),
    "data_files_read": {
        "module-rules-testcases.csv": {"rows": len(MODULE_CASES), "columns": list(MODULE_CASES[0].keys()) if MODULE_CASES else []},
        "cross-module-combos.csv": {"rows": len(CROSS_CASES), "columns": list(CROSS_CASES[0].keys()) if CROSS_CASES else []},
        "total_expected_cases": len(MODULE_CASES) + len(CROSS_CASES),
    },
    "bulk_results": {"total": len(MATRIX), "success": len(SUCCESS), "config_or_api_errors": len(ERRORS)},
    "aggregate": dict(agg),
    "job_placement_changed_cases": len(changed_jobs_cases),
    "drive_changed_cases": len(changed_drive_cases),
    "route_changed_cases": len(changed_route_cases),
    "changed_drive_sample": [{"name": x["name"], "capture": x["capture"], "drive_time": x["drive_time"], "jobs": x["jobs"]} for x in changed_drive_cases[:8]],
    "changed_route_sample": [{"name": x["name"], "capture": x["capture"], "routes": x["routes"], "jobs": x["jobs"]} for x in changed_route_cases[:8]],
    "changed_jobs_sample": changed_jobs_cases[:8],
    "rows": rows,
}
(REPORTS / "deep-raw-response-analysis.json").write_text(json.dumps(summary, indent=2))

md = []
md.append("# Mantis Deep Raw Response Analysis")
md.append("")
md.append(f"Generated: `{summary['generated_at']}`")
md.append("")
md.append("## Data corpus read")
md.append("")
md.append("| File | Rows | Purpose |")
md.append("|---|---:|---|")
md.append(f"| `data/module-rules-testcases.csv` | {len(MODULE_CASES)} | Module-level expected behavior: Workforce Boundaries, Route Efficiency, Service Commitments, Custom Rules combos |")
md.append(f"| `data/cross-module-combos.csv` | {len(CROSS_CASES)} | Cross-module WB + RE + SC + CR conflict/priority cases |")
md.append(f"| **Total expected cases** | **{len(MODULE_CASES) + len(CROSS_CASES)}** | Full expected corpus |")
md.append("")
md.append("These two files were not read before the earlier bulk summary. They are now read and used as the expected-behavior oracle. Important: the already-run bulk 450 suite is **not a faithful execution of all 1,455 CSV cases**; it was generated from separate system/filter combinations and had payload-key mismatches. So the 450 run is valid as API-load/raw-response evidence, but not enough as final rule-corpus verdict.")
md.append("")
md.append("## Raw response layers inspected")
md.append("")
md.append("For every successful `manual/optimize` stream, the analyzer read these API chunks directly from `optimize.ndjson`:")
md.append("")
md.append("- `type=jobs, scope=before`")
md.append("- `type=drive_time, scope=before`")
md.append("- `type=route, scope=before`")
md.append("- `type=jobs, scope=optimized`")
md.append("- `type=drive_time, scope=optimized`")
md.append("- `type=route, scope=optimized`")
md.append("- `type=stats, scope=daily|total`")
md.append("")
md.append("## Aggregate results from raw chunks")
md.append("")
md.append("| Check | Count | Meaning |")
md.append("|---|---:|---|")
md.append(f"| Successful optimize streams | {len(SUCCESS)} | Raw `optimize.ndjson` captures available |")
md.append(f"| Job placement changed cases | {len(changed_jobs_cases)} | Any job added/removed OR changed `start/end/date_label/schedule_id/length` |")
md.append(f"| Drive-time changed cases | {len(changed_drive_cases)} | Segment value/time/order/job-id set changed |")
md.append(f"| Route polyline changed cases | {len(changed_route_cases)} | Route chunk payload changed by schedule/day |")
md.append(f"| Stats work-time mismatch cases | {agg.get('stats_work_time_mismatch', 0)} | `stats.work_time.after` does not equal sum of optimized job lengths |")
md.append(f"| Stats drive-time mismatch cases | {agg.get('stats_drive_time_mismatch', 0)} | `stats.drive_time.after` does not equal sum of optimized drive segments |")
md.append("")
md.append("## Correct interpretation")
md.append("")
md.append("Anh đúng: a job can legitimately move to another date, be removed from a date, or be added to a date. So the correct check is not a single `jobs_moved` count. The analyzer now compares the raw job universe and classifies:")
md.append("")
md.append("- same/different job-id set")
md.append("- missing jobs from optimized")
md.append("- added jobs in optimized")
md.append("- date/day changes")
md.append("- start/end changes")
md.append("- schedule/tech changes")
md.append("- length changes")
md.append("")
md.append("In the current 292 successful captures, raw jobs still show **0 placement changes** by those criteria. That means this particular bulk response set does not prove optimized placement correctness. It does not mean moving jobs would be wrong; it means these responses did not expose moved jobs in the `jobs.optimized` chunk.")
md.append("")
md.append("## Drive-time vs jobs nuance")
md.append("")
md.append("Drive time can change without job start/end changing. Example `drive_buffer` cases add buffer to drive segments. That is a valid separate layer. But if a rule is supposed to move jobs, then at least one of job date/start/end/schedule should change OR route/feed/accept logs must explain why not. Current bulk captures mostly show drive/stats changes without job placement changes, so verdict is `REACHES_ENGINE` for drive-buffer only, not `PASS` for placement rules.")
md.append("")
if changed_drive_cases:
    md.append("### Drive-time changed sample")
    md.append("")
    md.append("| Scenario | Capture | Before sum | Optimized sum | Delta | Value-changed segments | Job placement changed? |")
    md.append("|---|---|---:|---:|---:|---:|---|")
    for x in changed_drive_cases[:12]:
        d=x['drive_time']; j=x['jobs']
        md.append(f"| `{x['name']}` | `{x['capture']}` | {d['before_sum']} | {d['optimized_sum']} | {d['delta_sum']} | {d['value_changed_count']} | {'yes' if j['changed_count'] or j['missing_ids'] or j['added_ids'] else 'no'} |")
    md.append("")
if changed_route_cases:
    md.append("### Route changed sample")
    md.append("")
    md.append("| Scenario | Capture | Changed route chunks | Same route keys | Job placement changed? |")
    md.append("|---|---|---:|---|---|")
    for x in changed_route_cases[:12]:
        r=x['routes']; j=x['jobs']
        md.append(f"| `{x['name']}` | `{x['capture']}` | {r['changed_routes']} | {r['same_keys']} | {'yes' if j['changed_count'] or j['missing_ids'] or j['added_ids'] else 'no'} |")
    md.append("")
md.append("## What is still not proven")
md.append("")
md.append("- Whether jobs that should move to another day actually do so under exact CSV rules.")
md.append("- Whether jobs added/removed from a specific day are correct, because the 450 run did not produce added/removed optimized job sets.")
md.append("- Whether conflict priorities from `cross-module-combos.csv` are honored; those require corrected payloads and Custom Rules setup/cleanup.")
md.append("- Whether modal Sandbox routes match after accept; preview-only responses do not provide enough explainability feeds.")
md.append("")
md.append("## Next run required")
md.append("")
md.append("Generate a corrected CSV-driven suite from the two data files, starting with 40–60 cases, using exact API field names/shapes, then validate each response with this raw layered comparator. Only after setup read-back is correct should we scale back to 1,455 corpus cases.")
(REPORTS / "deep-raw-response-analysis.md").write_text("\n".join(md)+"\n")
print(json.dumps({k: summary[k] for k in ['data_files_read','bulk_results','job_placement_changed_cases','drive_changed_cases','route_changed_cases']}, indent=2))
print(REPORTS / 'deep-raw-response-analysis.md')
print(REPORTS / 'deep-raw-response-analysis.json')
