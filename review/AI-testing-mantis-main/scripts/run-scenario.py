import json, os, pathlib, subprocess, sys, datetime

SKILL = pathlib.Path(__file__).resolve().parent.parent
CAPTURES = SKILL / "captures"
ENDPOINTS = {
    "system-rules": "routing/system-rules",
    "workforce-boundaries": "routing/workforce-boundaries",
    "route-efficiency": "routing/route-efficiency",
    "service-commitment": "routing/service-commitment",
}


def env():
    cfg = {}
    for line in (CAPTURES / ".env.local").read_text().splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            cfg[k.strip()] = v.strip()
    return cfg


E = env()
HEADERS = [
    "-H", f"token: {E['GD_TOKEN']}",
    "-H", f"gd-branch-id: {E['GD_BRANCH_ID']}",
    "-H", "platform: web",
    "-H", "Content-Type: application/json",
]


def call(path, method="GET", body=None, stream=False, timeout=240):
    # The sandbox certificate chain expired on 2026-08-23; use -k so
    # verification can continue while still avoiding token/secret output.
    cmd = ["curl", "-k", "-s", "-m", str(timeout), *HEADERS]
    if stream:
        cmd += ["-H", "Accept: text/event-stream"]
    if method != "GET":
        cmd += ["-X", method]
    if body is not None:
        cmd += ["--data-raw", json.dumps(body)]
    cmd.append(E["API_BASE"] + path)
    return subprocess.run(cmd, capture_output=True, text=True).stdout


def get_config(name):
    return json.loads(call(ENDPOINTS[name]))["data"]


def put_config(name, data):
    return json.loads(call(ENDPOINTS[name], "PUT", data) or "{}")


def snapshot():
    return {name: get_config(name) for name in ENDPOINTS}


def restore(snap):
    failed = []
    for name, data in snap.items():
        res = put_config(name, data)
        if not res.get("success"):
            failed.append((name, res.get("message")))
    return failed


def parse_ndjson(text):
    out = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out


def jobs_by_id(chunks, scope):
    out = {}
    for c in chunks:
        if c.get("type") == "jobs" and c.get("scope") == scope:
            for j in c["data"]:
                out[j["job"]["id"]] = {
                    "start": j["event"]["start"],
                    "end": j["event"]["end"],
                    "schedule": j["schedule"]["id"],
                    "length": j["event"]["length"],
                    "day": j["date_label"],
                }
    return out


def segments(chunks, kind, scope):
    out = []
    for c in chunks:
        if c.get("type") == kind and c.get("scope") == scope:
            out.extend(c["data"])
    return out


def minutes(iso):
    return int(iso[11:13]) * 60 + int(iso[14:16])


def stats_total(chunks):
    for c in chunks:
        if c.get("type") == "stats" and c.get("scope") == "total":
            return c["data"]
    return {}


def summarize(chunks):
    before, opt = jobs_by_id(chunks, "before"), jobs_by_id(chunks, "optimized")
    moved = [k for k in before if k in opt and before[k] != opt[k]]
    db, do = segments(chunks, "drive_time", "before"), segments(chunks, "drive_time", "optimized")
    st = stats_total(chunks)

    def metric(key):
        m = st.get(key, {})
        return [m.get("before", {}).get("value"), m.get("after", {}).get("value")]

    per_day = {}
    for j in opt.values():
        per_day[j["day"]] = per_day.get(j["day"], 0) + 1

    return {
        "jobs_before": len(before),
        "jobs_optimized": len(opt),
        "jobs_moved": len(moved),
        "drive_segs": [len(db), len(do)],
        "drive_sum": [round(sum(s["value"] for s in db), 1), round(sum(s["value"] for s in do), 1)],
        "drive_jobid_set_equal": {s["job_id"] for s in db} == {s["job_id"] for s in do},
        "stats_work": metric("time_ratio") and [
            st.get("time_ratio", {}).get("work_time", {}).get("before", {}).get("value"),
            st.get("time_ratio", {}).get("work_time", {}).get("after", {}).get("value"),
        ],
        "stats_drive": metric("drive_time"),
        "stats_distance": metric("distance"),
        "stats_jobs_assigned": metric("jobs_assigned"),
        "max_jobs_one_day": max(per_day.values()) if per_day else 0,
        "days": len(per_day),
    }


def run(scenario, base_snapshot):
    name = scenario["name"]

    # Keep matrix runs isolated: each scenario must start from the saved baseline.
    # Otherwise a rule enabled by scenario N remains active for scenario N+1.
    failed = restore(base_snapshot)
    if failed:
        return {"name": name, "error": f"baseline restore failed before scenario: {failed}"}

    stamp = datetime.datetime.now().strftime("%y%m%d-%H%M%S")
    outdir = CAPTURES / f"{stamp}-{name}"
    outdir.mkdir(parents=True, exist_ok=True)

    applied = {}
    for endpoint, patch in scenario.get("config", {}).items():
        merged = dict(base_snapshot[endpoint])
        merged.update(patch)
        res = put_config(endpoint, merged)
        if not res.get("success"):
            return {"name": name, "error": f"config rejected: {res.get('message')}"}
        applied[endpoint] = get_config(endpoint)

    (outdir / "config-applied.json").write_text(json.dumps(applied, indent=2))
    body = scenario["filters"]
    (outdir / "request.json").write_text(json.dumps(body, indent=2))

    raw = call("routing/mantis/manual/optimize", "PUT", body, stream=True)
    (outdir / "optimize.ndjson").write_text(raw)
    chunks = parse_ndjson(raw)
    summary = summarize(chunks)
    summary["name"] = name
    summary["capture"] = outdir.name
    (outdir / "summary.json").write_text(json.dumps(summary, indent=2))
    return summary


def load_base():
    path = CAPTURES / "baseline-snapshot.json"
    if path.exists():
        return json.loads(path.read_text())
    base = snapshot()
    path.write_text(json.dumps(base, indent=2))
    return base


if __name__ == "__main__":
    if sys.argv[1] == "restore":
        print("failed:", restore(load_base()))
        sys.exit(0)

    scenarios = json.loads(pathlib.Path(sys.argv[1]).read_text())
    base = load_base()
    picked = sys.argv[2:] or [sc["name"] for sc in scenarios]
    results_path = CAPTURES / "matrix-results.json"
    results = json.loads(results_path.read_text()) if results_path.exists() else []

    lock = CAPTURES / ".runner.lock"
    if lock.exists() and (datetime.datetime.now().timestamp() - lock.stat().st_mtime) < 900:
        sys.exit("another runner is active; delete captures/.runner.lock to override")
    lock.write_text(str(os.getpid()))

    try:
        for sc in scenarios:
            if sc["name"] not in picked:
                continue
            r = run(sc, base)
            results = [x for x in results if x.get("name") != r.get("name")] + [r]
            results_path.write_text(json.dumps(results, indent=2))
            print(json.dumps(r), flush=True)
    finally:
        failed = restore(base)
        lock.unlink(missing_ok=True)
        print("RESTORE_FAILED" if failed else "RESTORE_OK", failed or "", file=sys.stderr)
