import argparse
import datetime
import importlib.util
import json
import pathlib
import re
import sys
import urllib.parse

SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
RUN_SCENARIO = SCRIPT_DIR / "run-scenario.py"
spec = importlib.util.spec_from_file_location("run_scenario", RUN_SCENARIO)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {RUN_SCENARIO}")
rs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rs)

CAPTURES = rs.CAPTURES
INCLUDE_ROUTES = False


def parse_ndjson(text):
    chunks = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            chunks.append(json.loads(line))
        except Exception:
            chunks.append({"_parse_error": line[:300]})
    return chunks


def q(params):
    clean = {k: v for k, v in params.items() if v not in (None, "")}
    return urllib.parse.urlencode(clean, doseq=True)


def ndjson_summary(chunks):
    counts = {}
    optimization_id = None
    rows = 0
    jobs = 0
    routes = 0
    errors = 0
    for c in chunks:
        if c.get("_parse_error"):
            errors += 1
            continue
        key = f"{c.get('type')}:{c.get('scope')}"
        counts[key] = counts.get(key, 0) + 1
        if c.get("optimization_id"):
            optimization_id = c.get("optimization_id")
        data = c.get("data")
        if isinstance(data, dict) and data.get("optimization_id"):
            optimization_id = data.get("optimization_id")
        if isinstance(c.get("items"), list):
            rows += len(c["items"])
        if isinstance(data, list):
            rows += len(data)
            if c.get("type") in ("jobs", "events"):
                jobs += len(data)
            if c.get("type") == "route":
                routes += len(data)
    return {
        "chunk_count": len(chunks),
        "chunk_types": counts,
        "optimization_id": optimization_id,
        "row_count": rows,
        "jobs_count": jobs,
        "route_count": routes,
        "parse_errors": errors,
    }


def sandbox_params(filters):
    allowed = [
        "schedule_ids", "start", "end", "statuses", "inc", "color_id",
        "jobs_per_day", "drive_buffer", "optimize_to", "exclude",
    ]
    params = {k: filters.get(k) for k in allowed if k in filters}
    params.setdefault("agenda", "agendaWeek")
    return params


def restore_touched(base, endpoints):
    failed = []
    for ep in endpoints:
        res = rs.put_config(ep, base[ep])
        if not res.get("success"):
            failed.append((ep, res.get("message")))
    return failed


def apply_config(base, config):
    applied = {}
    for ep, patch in config.items():
        merged = dict(base[ep])
        merged.update(patch)
        res = rs.put_config(ep, merged)
        if not res.get("success"):
            return applied, [(ep, res.get("message"))]
        applied[ep] = rs.get_config(ep)
    return applied, []


def run_case(case, out_root, base):
    name = case["name"]
    filters = case["filters"]
    config = case.get("config", {})
    touched = list(config.keys())
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "-", name)[:120]
    out = out_root / safe
    out.mkdir(parents=True, exist_ok=True)
    (out / "scenario.json").write_text(json.dumps(case, indent=2))

    result = {
        "name": name,
        "expected_source": case.get("expected_source"),
        "business_api_counts": {},
        "apis": {},
        "setup": {"touched_settings": touched},
    }

    # Settings are setup only. They are not counted as feature-quality API coverage.
    if touched:
        pre_failed = restore_touched(base, touched)
        result["setup"]["pre_restore_failed"] = pre_failed
        if pre_failed:
            return result
        applied, apply_failed = apply_config(base, config)
        result["setup"]["apply_failed"] = apply_failed
        result["setup"]["applied"] = applied
        if apply_failed:
            restore_touched(base, touched)
            return result

    try:
        # 1) Manual optimize preview — Route Optimizer modal quality API.
        (out / "request-manual-optimize.json").write_text(json.dumps(filters, indent=2))
        raw_manual = rs.call("routing/mantis/manual/optimize", "PUT", filters, stream=True, timeout=300)
        (out / "manual-optimize.ndjson").write_text(raw_manual or "")
        manual_chunks = parse_ndjson(raw_manual)
        result["business_api_counts"]["PUT /routing/mantis/manual/optimize"] = 1
        result["apis"]["PUT /routing/mantis/manual/optimize"] = ndjson_summary(manual_chunks)
        try:
            result["manual_summary"] = rs.summarize([c for c in manual_chunks if not c.get("_parse_error")])
        except Exception as exc:
            result["manual_summary_error"] = str(exc)

        # 2) Sandbox jobs — Sandbox list/timeline quality API.
        params = sandbox_params(filters)
        (out / "request-sandbox-jobs.json").write_text(json.dumps(params, indent=2))
        raw_jobs = rs.call("routing/mantis/autopilot/jobs?" + q(params), stream=True, timeout=240)
        (out / "sandbox-jobs.ndjson").write_text(raw_jobs or "")
        job_chunks = parse_ndjson(raw_jobs)
        job_summary = ndjson_summary(job_chunks)
        result["business_api_counts"]["GET /routing/mantis/autopilot/jobs"] = 1
        result["apis"]["GET /routing/mantis/autopilot/jobs"] = job_summary

        # 3) Sandbox routes — optional only. It is mostly polyline data, not rule-quality evidence.
        if INCLUDE_ROUTES:
            opt_id = job_summary.get("optimization_id")
            if opt_id:
                route_params = {**params, "optimization_id": opt_id}
                (out / "request-sandbox-routes.json").write_text(json.dumps({**params, "optimization_id": "<captured>"}, indent=2))
                raw_routes = rs.call("routing/mantis/autopilot/routes?" + q(route_params), stream=True, timeout=240)
                (out / "sandbox-routes.ndjson").write_text(raw_routes or "")
                result["business_api_counts"]["GET /routing/mantis/autopilot/routes"] = 1
                result["apis"]["GET /routing/mantis/autopilot/routes"] = ndjson_summary(parse_ndjson(raw_routes))
            else:
                result["business_api_counts"]["GET /routing/mantis/autopilot/routes"] = 0
                result["apis"]["GET /routing/mantis/autopilot/routes"] = {"skipped": "no optimization_id from sandbox jobs"}
        else:
            result["business_api_counts"]["GET /routing/mantis/autopilot/routes"] = 0
            result["apis"]["GET /routing/mantis/autopilot/routes"] = {"skipped": "disabled: route polylines are not rule-quality evidence"}
    finally:
        if touched:
            result["setup"]["post_restore_failed"] = restore_touched(base, touched)

    (out / "summary.json").write_text(json.dumps(result, indent=2))
    return result


def main():
    parser = argparse.ArgumentParser(description="Run core Mantis feature-quality APIs with rule-based filters/scenarios.")
    parser.add_argument("scenario_file")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--prefix", default="core-business")
    parser.add_argument("--include-routes", action="store_true", help="Also call sandbox routes when sandbox jobs returns optimization_id. Default is off because routes are polylines only.")
    args = parser.parse_args()
    global INCLUDE_ROUTES
    INCLUDE_ROUTES = args.include_routes

    scenarios = json.loads(pathlib.Path(args.scenario_file).read_text())
    selected = scenarios[args.start: args.start + args.limit if args.limit is not None else None]
    stamp = datetime.datetime.now().strftime("%y%m%d-%H%M%S")
    out_root = CAPTURES / f"{stamp}-{args.prefix}-{args.start}-{args.start + len(selected) - 1}"
    out_root.mkdir(parents=True, exist_ok=True)
    results_path = out_root / "results.jsonl"
    base = rs.load_base()

    api_counts = {
        "PUT /routing/mantis/manual/optimize": 0,
        "GET /routing/mantis/autopilot/jobs": 0,
        "GET /routing/mantis/autopilot/routes": 0,
    }
    setup_counts = {"cases_with_settings_setup": 0}
    results = []
    for case in selected:
        res = run_case(case, out_root, base)
        results.append(res)
        if res.get("setup", {}).get("touched_settings"):
            setup_counts["cases_with_settings_setup"] += 1
        for api, n in res.get("business_api_counts", {}).items():
            api_counts[api] += n
        with results_path.open("a") as f:
            f.write(json.dumps(res) + "\n")
        print(json.dumps({"name": res["name"], "api_counts": api_counts, "setup": res.get("setup"), "apis": res.get("apis")}), flush=True)

    summary = {
        "capture": out_root.name,
        "scenario_file": args.scenario_file,
        "start": args.start,
        "limit": len(selected),
        "business_api_counts": api_counts,
        "setup_counts": setup_counts,
        "case_count": len(results),
    }
    (out_root / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary), flush=True)


if __name__ == "__main__":
    main()
