import datetime
import importlib.util
import json
import pathlib
import urllib.parse

SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
RUN_SCENARIO = SCRIPT_DIR / "run-scenario.py"
spec = importlib.util.spec_from_file_location("run_scenario", RUN_SCENARIO)
rs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rs)

CAPTURES = rs.CAPTURES
STAMP = datetime.datetime.now().strftime("%y%m%d-%H%M%S")
OUT = CAPTURES / f"{STAMP}-sandbox-feeds-suite"
OUT.mkdir(parents=True, exist_ok=True)

SCHEDULE_ID = "245"
COMMON = {
    "agenda": "agendaWeek",
    "color_id": 1,
    "inc": "recurring",
    "schedule_ids": SCHEDULE_ID,
}
RANGES = {
    "current-week": {
        "start": "2026-08-16T00:00:00.000Z",
        "end": "2026-08-22T23:59:59.999Z",
    },
    "future-week": {
        "start": "2026-08-23T00:00:00.000Z",
        "end": "2026-08-29T23:59:59.999Z",
    },
}

def q(params):
    return urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})

def save(name, text):
    p = OUT / name
    p.write_text(text or "")
    return p.name

def get_json(path, params=None):
    full = path + (("?" + q(params)) if params else "")
    raw = rs.call(full, timeout=180)
    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = None
    return raw, parsed

def parse_ndjson(text):
    out = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            pass
    return out

def ndjson_summary(chunks):
    counts = {}
    optimization_id = None
    items = 0
    jobs_data = 0
    route_points = 0
    for c in chunks:
        key = f"{c.get('type')}:{c.get('scope')}"
        counts[key] = counts.get(key, 0) + 1
        optimization_id = c.get("optimization_id") or c.get("data", {}).get("optimization_id") if isinstance(c.get("data"), dict) else optimization_id
        if c.get("optimization_id"):
            optimization_id = c.get("optimization_id")
        if isinstance(c.get("items"), list):
            items += len(c["items"])
        if isinstance(c.get("data"), list):
            if c.get("type") == "jobs" or "job" in (c["data"][0] if c["data"] else {}):
                jobs_data += len(c["data"])
            if c.get("type") == "route":
                route_points += len(c["data"])
    return {"chunk_count": len(chunks), "counts": counts, "optimization_id": optimization_id, "items": items, "jobs_data": jobs_data, "route_points": route_points}

results = []

# Make sure the shared account starts clean.
restore_failed = rs.restore(rs.load_base())
results.append({"case": "pre-restore", "api": "restore", "restore_failed": restore_failed})

# Sandbox jobs + routes for current/future ranges.
for label, rng in RANGES.items():
    params = {**COMMON, **rng}
    raw = rs.call("routing/mantis/autopilot/jobs?" + q(params), stream=True, timeout=240)
    fname = save(f"{label}-autopilot-jobs.ndjson", raw)
    chunks = parse_ndjson(raw)
    summary = ndjson_summary(chunks)
    results.append({"case": f"{label}-autopilot-jobs", "api": "GET /routing/mantis/autopilot/jobs", "params": params, "raw": fname, **summary})

    opt_id = summary.get("optimization_id")
    if opt_id:
        route_params = {**params, "optimization_id": opt_id}
        raw_routes = rs.call("routing/mantis/autopilot/routes?" + q(route_params), stream=True, timeout=240)
        rname = save(f"{label}-autopilot-routes.ndjson", raw_routes)
        rchunks = parse_ndjson(raw_routes)
        rsummary = ndjson_summary(rchunks)
        results.append({"case": f"{label}-autopilot-routes", "api": "GET /routing/mantis/autopilot/routes", "params": {**params, "optimization_id": "<captured>"}, "optimization_id_from_jobs": opt_id, "raw": rname, **rsummary})
    else:
        results.append({"case": f"{label}-autopilot-routes", "api": "GET /routing/mantis/autopilot/routes", "skipped": "no optimization_id from jobs"})

# Manual optimize current week using the real modal payload shape supplied by user.
manual_body = {
    "schedule_ids": SCHEDULE_ID,
    "start": "2026-08-16T00:00:00+00:00",
    "end": "2026-08-22T23:59:59+00:00",
    "statuses": -1,
    "inc": "recurring",
    "color_id": 1,
    "exclude": [6, 0],
}
raw_manual = rs.call("routing/mantis/manual/optimize", "PUT", manual_body, stream=True, timeout=300)
manual_name = save("current-week-manual-optimize.ndjson", raw_manual)
manual_chunks = parse_ndjson(raw_manual)
manual_summary = rs.summarize(manual_chunks)
manual_summary.update(ndjson_summary(manual_chunks))
results.append({"case": "current-week-manual-optimize", "api": "PUT /routing/mantis/manual/optimize", "body": manual_body, "raw": manual_name, **manual_summary})

# Feeds history/errors/count by range and routing type.
history_ids = []
for label, rng in RANGES.items():
    for routing_type in ["all", "manual", "autopilot"]:
        params = {"start": rng["start"], "end": rng["end"], "schedule_ids": SCHEDULE_ID, "routing_type": routing_type}
        for endpoint, case_suffix in [
            ("routing/mantis/feeds/history", "history"),
            ("routing/mantis/feeds/errors", "errors"),
            ("routing/mantis/feeds/errors/count", "errors-count"),
        ]:
            raw, parsed = get_json(endpoint, params)
            fname = save(f"{label}-{routing_type}-{case_suffix}.json", json.dumps(parsed, indent=2) if parsed is not None else raw)
            data = parsed.get("data") if isinstance(parsed, dict) else None
            count = len(data) if isinstance(data, list) else (data.get("total") if isinstance(data, dict) else None)
            results.append({"case": f"{label}-{routing_type}-{case_suffix}", "api": f"GET /{endpoint}", "params": params, "raw": fname, "success": parsed.get("success") if isinstance(parsed, dict) else None, "count": count})
            if case_suffix == "history" and isinstance(data, list):
                for row in data[:3]:
                    if isinstance(row, dict) and row.get("id") is not None:
                        history_ids.append(str(row["id"]))

# Logs for discovered history ids (dedup cap 5).
seen = []
for hid in history_ids:
    if hid not in seen:
        seen.append(hid)
for hid in seen[:5]:
    raw, parsed = get_json(f"routing/mantis/feeds/history/{hid}/logs")
    fname = save(f"history-{hid}-logs.json", json.dumps(parsed, indent=2) if parsed is not None else raw)
    data = parsed.get("data") if isinstance(parsed, dict) else None
    results.append({"case": f"history-{hid}-logs", "api": f"GET /routing/mantis/feeds/history/{hid}/logs", "raw": fname, "success": parsed.get("success") if isinstance(parsed, dict) else None, "count": len(data) if isinstance(data, list) else None})

restore_failed = rs.restore(rs.load_base())
results.append({"case": "post-restore", "api": "restore", "restore_failed": restore_failed})

(OUT / "results.json").write_text(json.dumps(results, indent=2))
summary = {
    "capture": OUT.name,
    "case_count": len(results),
    "apis_called": sum(1 for r in results if r.get("api") != "restore"),
    "restore_failed": restore_failed,
    "notable": [r for r in results if r.get("count") not in (None, 0) or r.get("optimization_id") or r.get("jobs_optimized")],
}
(OUT / "summary.json").write_text(json.dumps(summary, indent=2))
print(json.dumps(summary))
