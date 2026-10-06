#!/usr/bin/env python3
"""Summarize previous bulk-450 raw-response patterns while corrected suite runs."""
import collections
import json
from pathlib import Path
from datetime import datetime
ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports"
analysis = json.loads((REPORTS / "deep-raw-response-analysis.json").read_text())
bulk = json.loads((REPORTS / "bulk-450-analysis.json").read_text())
rows = analysis["rows"]

def names_for_drive_delta(delta, limit=25):
    return [r["name"] for r in rows if round(r["drive_time"]["delta_sum"], 1) == delta][:limit]

delta_counter = collections.Counter(round(r["drive_time"]["delta_sum"], 1) for r in rows)
route_counter = collections.Counter(r["routes"]["changed_routes"] for r in rows)
job_counter = collections.Counter((r["jobs"]["before_count"], r["jobs"]["optimized_count"], r["jobs"]["changed_count"]) for r in rows)

# Pull explicit jobs_per_day violations from bulk analysis.
jpd_violations = bulk.get("jobs_per_day_violations_sample", [])
setup_fields = bulk.get("top_setup_field_issues", [])
errors = bulk.get("error_categories", {})

md=[]
md.append("# Previous Bulk 450 Pattern Analysis")
md.append("")
md.append(f"Generated: `{datetime.now().isoformat(timespec='seconds')}`")
md.append("")
md.append("## What the previous API responses actually show")
md.append("")
md.append("| Raw layer | Finding |")
md.append("|---|---|")
md.append(f"| Jobs | `{analysis['job_placement_changed_cases']} / {analysis['bulk_results']['success']}` successful streams changed job placement. All successful raw jobs retained same job-id set and same start/end/date/schedule. |")
md.append(f"| Drive time | `{analysis['drive_changed_cases']} / {analysis['bulk_results']['success']}` changed drive-time segments. This is real API evidence but does not by itself prove job movement. |")
md.append(f"| Routes | `{analysis['route_changed_cases']} / {analysis['bulk_results']['success']}` changed route polyline chunks. Route geometry changed even when jobs placement did not. |")
md.append(f"| Stats | work-time mismatch `{analysis['aggregate'].get('stats_work_time_mismatch',0)}`, drive-time mismatch `{analysis['aggregate'].get('stats_drive_time_mismatch',0)}`. Stats cannot be sole truth source. |")
md.append("")
md.append("## Drive delta distribution")
md.append("")
md.append("| Optimized-before drive delta | Count | Interpretation |")
md.append("|---:|---:|---|")
for delta,count in delta_counter.most_common():
    if count < 1: continue
    interp = "default future-week geometry/route delta" if delta == 77.9 else "current-week delta" if delta == -26.8 else "drive_buffer/filter or special route effect"
    md.append(f"| {delta} | {count} | {interp} |")
md.append("")
md.append("## Route changed chunks distribution")
md.append("")
md.append("| Changed route chunks | Count |")
md.append("|---:|---:|")
for k,v in route_counter.most_common(): md.append(f"| {k} | {v} |")
md.append("")
md.append("## Job count distribution")
md.append("")
md.append("| before jobs | optimized jobs | changed jobs | count |")
md.append("|---:|---:|---:|---:|")
for (b,o,c),v in job_counter.most_common(): md.append(f"| {b} | {o} | {c} | {v} |")
md.append("")
md.append("## Jobs-per-day strict violation samples")
md.append("")
md.append("These are valid defect candidates because the request carried a direct toolbar filter and raw summary still exceeded the cap.")
md.append("")
md.append("| Scenario | Capture | Expected max/day | Observed max/day |")
md.append("|---|---|---:|---:|")
for v in jpd_violations:
    md.append(f"| `{v['name']}` | `{v['capture']}` | {v['expected_max']} | {v['observed_max_day']} |")
md.append("")
md.append("## Setup problems from previous generator")
md.append("")
md.append("Previous bulk generator used wrong names/shapes for many API settings. The corrected suite now running fixes these before any new verdict is made.")
md.append("")
md.append("| Endpoint | Field sent before | Issue | Count |")
md.append("|---|---|---|---:|")
for item in setup_fields[:20]:
    md.append(f"| `{item['endpoint']}` | `{item['field']}` | `{item['issue']}` | {item['count']} |")
md.append("")
md.append("## Config rejection categories")
md.append("")
md.append("| Error category | Count |")
md.append("|---|---:|")
for k,v in errors.items(): md.append(f"| {k} | {v} |")
md.append("")
md.append("## Carry-forward rules for the corrected run")
md.append("")
md.append("1. Do not decide by one field. Compare raw `jobs`, `drive_time`, `route`, `stats`, and later `feeds/logs`.")
md.append("2. A job moved to another date/day can be correct; classify added/missing/date-changed/time-changed/schedule-changed separately.")
md.append("3. If jobs unchanged but drive/route changed, verdict can be `REACHES_ENGINE` for route/drive layer only, not placement PASS.")
md.append("4. If setup read-back mismatches intended CSV rule, verdict is `SETUP_FAIL`; do not judge optimizer behavior.")
md.append("5. For hard-rule proof, corrected run needs either changed jobs in `jobs.optimized` or accept/feed logs explaining no-move outcome.")
(REPORTS / "previous-bulk-450-patterns.md").write_text("\n".join(md)+"\n")
print(REPORTS / "previous-bulk-450-patterns.md")
print(json.dumps({"drive_delta_top": delta_counter.most_common(8), "route_changed": route_counter.most_common(), "job_counts": job_counter.most_common()}, indent=2))
