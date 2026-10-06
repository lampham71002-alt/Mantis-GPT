#!/usr/bin/env python3
"""Summarize a Mantis autopilot/jobs capture into audit evidence.

Reads a raw capture (SSE `data:` lines, NDJSON, or a response pasted inside other text),
takes the terminal `completed` event, and prints IDs, dates, times, and numbers only —
never customer names, addresses, or coordinates. `[MISMATCH]` lines break invariants
that held in the 2026-09 captures (SCHEMA FAIL evidence). `[FLAG]` lines are hard-rule
candidates and `[UNVERIFIABLE]` lines lack evidence; confirm every line against the
skill references before writing a verdict.

Examples:
  summarize-jobs-stream.py captures/260914-1637-S1.txt
  summarize-jobs-stream.py captures/260914-1637-S1.txt --max-jobs 12 --max-distance-mi 7 \\
      --max-travel-min 20 --restrict 2 --keep week --cross-tech off --max-departure 3:00PM
"""
import argparse
import collections
import datetime as dt
import json
import pathlib
import re

METERS_PER_MILE = 1609.344
# Engine locks that are not custom `lock` rules; custom_rule_signal_counts excludes them.
FIXED_LOCK_REASONS = {"freeze_window", "route_around"}


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("capture", help="raw stream capture or pasted response file")
    parser.add_argument("--today", help="YYYY-MM-DD; default = windows.horizon_start_unix date")
    parser.add_argument("--mode", choices=["sandbox", "manual", "autopilot", "unknown"], default="unknown",
                        help="evidence-confirmed mode; unknown does not assert Auto-Pilot gate semantics")
    parser.add_argument("--max-jobs", type=int, help="Max Jobs per Day")
    parser.add_argument("--max-distance-mi", type=float, help="Maximum Travel Distance per shift")
    parser.add_argument("--max-travel-min", type=float, help="Max Shift Travel Time per shift")
    parser.add_argument("--max-departure", help="Max Last Appointment Departure, e.g. 15:00 or 3:00PM")
    parser.add_argument("--restrict", type=int, help="Restrict Job Movement ±N days")
    parser.add_argument("--keep", choices=["week", "month"], help="Keep Original Period")
    parser.add_argument("--cross-tech", choices=["on", "off"], help="Route Across All Tech Schedules")
    parser.add_argument("--limit", type=int, default=15, help="max example rows per section")
    return parser.parse_args()


# ---------------------------------------------------------------- parsing helpers


def load_objects(text):
    """Decode complete top-level JSON values, including pretty/multiline SSE data."""
    normalized = "\n".join(line[5:].lstrip() if line.startswith("data:") else line
                           for line in text.splitlines())
    objects = []
    decoder, cursor = json.JSONDecoder(), 0
    for match in re.finditer(r"(?m)^\s*(?=\{)", normalized):
        start = match.end()
        if start < cursor:
            continue  # Already consumed inside a complete top-level object.
        try:
            value, end = decoder.raw_decode(normalized, start)
        except json.JSONDecodeError:
            continue
        cursor = end
        if isinstance(value, dict):
            objects.append(value)
    return objects


def wall(value):
    """ISO start/end: the clock part is the account wall clock; the offset is ignored."""
    if not value:
        return None
    text = str(value).replace(" ", "T").replace("Z", "+00:00")
    return dt.datetime.fromisoformat(text).replace(tzinfo=None)


def wall_unix(value):
    """Unix fields encode the same wall clock as UTC seconds."""
    if not isinstance(value, (int, float)):
        return None
    return dt.datetime.fromtimestamp(value, dt.timezone.utc).replace(tzinfo=None)


def week_start(day):
    """Return the Sunday opening the Sunday–Saturday week containing ``day``.

    ``date.weekday()`` is Monday=0..Sunday=6, so this deliberately does not use
    ISO week numbers or ``isocalendar()``.
    """
    return day - dt.timedelta(days=(day.weekday() + 1) % 7)


def clock_minutes(text):
    """Parse 15:00, 3:00PM, or 3:00 PM into minutes after midnight."""
    match = re.fullmatch(r"\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*", text)
    if not match:
        raise SystemExit(f"bad clock time: {text}")
    hour, minute, meridiem = int(match[1]), int(match[2]), (match[3] or "").lower()
    if meridiem == "pm" and hour != 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    return hour * 60 + minute


def minute_of_day(moment):
    return moment.hour * 60 + moment.minute


def hhmm(minutes):
    return "-" if minutes is None else f"{int(minutes) // 60:02d}:{int(minutes) % 60:02d}"


def fmt_time(moment):
    return "-" if moment is None else moment.strftime("%H:%M")


def fmt_miles(meters):
    return "-" if meters is None else f"{meters / METERS_PER_MILE:.2f}mi"


def fmt_drive(seconds):
    return "-" if seconds is None else f"{seconds / 60:.1f}min"


def side(job, name):
    return job.get(name) or {}


def constraints(job):
    return job.get("constraints_applied") or {}


def present(value):
    return value not in (None, False, "", [], {})


def report(label, ok, examples=(), limit=5):
    tail = "" if ok or not examples else "  e.g. " + ", ".join(str(x) for x in list(examples)[:limit])
    tag = "UNVERIFIABLE" if ok is None else "OK" if ok else "MISMATCH"
    print(f"  [{tag}] {label}{tail}")


# ---------------------------------------------------------------- context


class Context:
    """Parsed capture plus derived lookups shared by every section."""

    def __init__(self, args, objects, completed):
        self.args = args
        self.objects = objects
        self.completed = completed
        self.log = completed.get("feature_test_log") or {}
        self.jobs = [job for job in self.log.get("jobs") or [] if isinstance(job, dict)]
        self.windows = self.log.get("windows") or {}
        self.summary = self.log.get("summary") or {}
        self.features = self.log.get("features") or {}
        self.resolved = self.log.get("planning_resolved") or {}
        self.freeze_end = wall_unix(self.windows.get("freeze_end_unix"))
        self.horizon_start = wall_unix(self.windows.get("horizon_start_unix"))
        self.horizon_end = wall_unix(self.windows.get("horizon_end_unix"))
        if args.today:
            self.today = dt.date.fromisoformat(args.today)
        else:
            self.today = self.horizon_start.date() if self.horizon_start else None
        self.first_open = self.freeze_end.date() if self.freeze_end else None
        self.mode = args.mode
        self.honor_freeze = self.mode in ("sandbox", "autopilot") and self.windows.get("honor_freeze") is not False
        self.technicians = self._schedule_technicians()
        self.routes = self._routes()

    def _schedule_technicians(self):
        """Schedule id → non-zero user ids from `events` items and after-placement signals."""
        users = collections.defaultdict(set)
        for obj in self.objects:
            if obj.get("type") != "events":
                continue
            for item in obj.get("items") or []:
                schedule = (item or {}).get("schedule") or {}
                user = str(schedule.get("user_id") or "0")
                if schedule.get("id") is not None and user != "0":
                    users[str(schedule["id"])].add(user)
        for job in self.jobs:
            signal = (job.get("feature_signals") or {}).get("preferred_technician_matching") or {}
            if signal.get("assigned_user_id") not in (None, 0, "0") and side(job, "after").get("schedule_id") is not None:
                users[str(job["after"]["schedule_id"])].add(str(signal["assigned_user_id"]))
        return users

    def _routes(self):
        """Placed jobs grouped by after schedule + date, ordered by route_stop_index."""
        routes = collections.defaultdict(list)
        for job in self.jobs:
            after = job.get("after")
            if after and after.get("start"):
                routes[(str(after.get("schedule_id")), after["start"][:10])].append(job)
        for stops in routes.values():
            stops.sort(key=lambda j: (j["after"].get("route_stop_index") is None,
                                      j["after"].get("route_stop_index") or 0, j["after"]["start"]))
        return routes

    def technician(self, schedule_id):
        users = self.technicians.get(str(schedule_id)) or set()
        return next(iter(users)) if len(users) == 1 else None


# ---------------------------------------------------------------- sections


def run_section(ctx):
    frames = collections.Counter(obj.get("type") for obj in ctx.objects)
    print(f"RUN optimization_id={ctx.completed.get('optimization_id')} success={ctx.completed.get('success')} "
          f"schema_version={ctx.log.get('schema_version')} jobs={len(ctx.jobs)} frames={dict(frames)}")
    if not ctx.log:
        print("  [UNVERIFIABLE] completed event has no feature_test_log")
    offsets = {str(side(j, n).get("start"))[19:] for j in ctx.jobs for n in ("before", "after") if side(j, n).get("start")}
    if offsets - {"+00:00", ""}:
        print(f"  [NOTE] start offsets {sorted(offsets)}: unix fields may not share the wall clock; re-check date math")


def config_section(ctx):
    print("\nCONFIG features (compare with the checklist; value field names vary per key)")
    for key, value in ctx.features.items():
        shown = {k: v for k, v in value.items() if k not in ("label", "module", "note")} if isinstance(value, dict) else value
        print(f"  {key}: {json.dumps(shown, ensure_ascii=False)}")
    print(f"  planning_resolved: {json.dumps(ctx.resolved, ensure_ascii=False)}")
    exposed = " ".join(ctx.features)
    for name, token in (("Restrict Job Movement", "restrict"), ("Keep Original Period", "period")):
        if token not in exposed:
            print(f"  [NOTE] {name} is not in features: config check UNVERIFIABLE; judge placement only")


def window_section(ctx):
    print("\nWINDOWS (wall clock)")
    for key in sorted(ctx.windows):
        value = ctx.windows[key]
        print(f"  {key}: {wall_unix(value) if key.endswith('_unix') else value}")
    if ctx.mode not in ("sandbox", "autopilot"):
        print(f"  [NOTE] mode={ctx.mode}: Auto-Pilot Freeze/Window assertions skipped; check manual requested range separately")
        return
    if not (ctx.horizon_start and ctx.horizon_end):
        print("  [UNVERIFIABLE] horizon window missing")
        return
    days = (ctx.horizon_end.date() - ctx.horizon_start.date()).days + 1
    print(f"  derived: today={ctx.today} horizon={ctx.horizon_start.date()}..{ctx.horizon_end.date()} ({days} days) "
          f"first_open_day={ctx.first_open} open_range={ctx.first_open}..{ctx.horizon_end.date()}")
    if ctx.today != ctx.horizon_start.date():
        print(f"  [MISMATCH] --today {ctx.today} differs from horizon_start {ctx.horizon_start.date()}")
    freeze = str((ctx.features.get("freeze_window") or {}).get("days") or "")
    freeze_days = 1 if freeze == "work_day" else int(re.match(r"\d+", freeze)[0]) if re.match(r"\d+", freeze) else None
    if freeze_days is not None and ctx.first_open:
        report(f"freeze_end == today + {freeze_days} day(s) (Freeze {freeze})",
               ctx.first_open == ctx.today + dt.timedelta(days=freeze_days))
    horizon = re.match(r"\d+", str((ctx.features.get("optimization_horizon") or {}).get("value") or ""))
    if horizon:
        report(f"horizon spans {horizon[0]} days from today", days == int(horizon[0]))
    placement_start = wall_unix(ctx.windows.get("placement_start_unix"))
    placement_end = wall_unix(ctx.windows.get("placement_end_unix"))
    if placement_start and ctx.freeze_end:
        report("placement_start == freeze_end", placement_start == ctx.freeze_end)
    if placement_end:
        report("placement_end == horizon_end + 1s", placement_end == ctx.horizon_end + dt.timedelta(seconds=1))


def inside_hours(placement, hours):
    start, end = wall(placement.get("start")), wall(placement.get("end"))
    low, high = hours.get("operating_start_min"), hours.get("operating_end_min")
    if not (start and end) or low is None or high is None:
        return None
    end_minute = minute_of_day(end) if end.date() == start.date() else 24 * 60
    return minute_of_day(start) >= low and end_minute <= high


def invariant_section(ctx):
    jobs, summary = ctx.jobs, ctx.summary
    print("\nINVARIANTS (held in the 2026-09 captures; MISMATCH = SCHEMA FAIL evidence)")
    statuses = collections.Counter(j.get("routing_status") for j in jobs)
    total = summary.get("total_calendar_jobs")
    report(f"len(jobs) {len(jobs)} == summary.total_calendar_jobs {total}", None if total is None else len(jobs) == total)
    by_status = dict(summary.get("by_status") or {})
    report(f"summary.by_status {by_status} == routing_status counts {dict(statuses)}",
           None if summary.get("by_status") is None else by_status == dict(statuses))
    routed = sum(1 for j in jobs if j.get("is_routed"))
    report(f"routed_count {summary.get('routed_count')} == is_routed {routed} == optimized {statuses.get('optimized', 0)}",
           None if summary.get("routed_count") is None or any("is_routed" not in j for j in jobs)
           else summary["routed_count"] == routed == statuses.get("optimized", 0))
    report("routed_count + not_routed_count == total_calendar_jobs",
           None if any(summary.get(k) is None for k in ("routed_count", "not_routed_count", "total_calendar_jobs"))
           else summary["routed_count"] + summary["not_routed_count"] == total)
    for name in ("before", "after"):
        flagged = [j.get("job_id") for j in jobs if (j.get("work_hours") or {}).get(f"{name}_inside_hours") is False]
        count = summary.get(f"outside_operating_hours_{name}_count")
        complete = count is not None and all(f"{name}_inside_hours" in (j.get("work_hours") or {}) for j in jobs)
        report(f"outside_operating_hours_{name}_count {count} == work_hours flags {len(flagged)}",
               count == len(flagged) if complete else None, flagged)
    recomputed = []
    for job in jobs:
        hours = job.get("work_hours") or {}
        for name in ("before", "after"):
            stated, actual = hours.get(f"{name}_inside_hours"), inside_hours(side(job, name), hours)
            if stated is not None and actual is not None and stated != actual:
                recomputed.append(f"{job.get('job_id')}:{name}")
    report("work_hours.*_inside_hours == wall-clock recompute", not recomputed, recomputed)
    travel = summary.get("travel") or {}
    for field, key in (("drive_sec", "after_total_drive_sec"), ("distance_m", "after_total_distance_m")):
        legs = sum(side(j, "after").get(field) or 0 for j in jobs)
        report(f"summary.travel.{key} {travel.get(key)} == sum(after.{field}) {legs}",
               None if travel.get(key) is None else travel[key] == legs)
    if not sum(side(j, "before").get("distance_m") or 0 for j in jobs) and not travel.get("before_total_distance_m"):
        print("  [NOTE] before legs and before travel totals are 0: travel savings are UNVERIFIABLE from this stream")

    problems = collections.defaultdict(list)
    for job in jobs:
        before, after, status, lock = side(job, "before"), job.get("after"), job.get("routing_status"), constraints(job)
        same = bool(after) and before.get("start") == after.get("start") and str(before.get("schedule_id")) == str(after.get("schedule_id"))
        job_id = job.get("job_id")
        if status == "unassigned" and after:
            problems["unassigned job has an after placement"].append(job_id)
        if status == "unchanged" and not same:
            problems["unchanged job changed placement"].append(job_id)
        if status == "outside_freeze_window" and after:
            before_tech = ctx.technician(before.get("schedule_id"))
            after_tech = ctx.technician(after.get("schedule_id"))
            changed_time = before.get("start") != after.get("start")
            changed_tech = before_tech is not None and after_tech is not None and before_tech != after_tech
            if changed_time or changed_tech:
                problems["frozen job changed placement (Freeze FAIL)"].append(job_id)
            elif before_tech is None or after_tech is None:
                print(f"  [UNVERIFIABLE] frozen job {job_id}: technician identity missing")
        if status == "outside_freeze_window" and not (lock.get("locked") and lock.get("lock_reason") == "freeze_window"):
            problems["frozen job without a freeze_window lock"].append(job_id)
        start = wall(before.get("start"))
        if ctx.honor_freeze and ctx.freeze_end and start and start < ctx.freeze_end and status != "outside_freeze_window":
            problems["job before freeze_end not marked outside_freeze_window"].append(job_id)
        if "is_routed" in job and (status == "optimized") != bool(job.get("is_routed")):
            problems["is_routed disagrees with status optimized"].append(job_id)
    for label in ("unassigned job has an after placement", "unchanged job changed placement",
                  "frozen job changed placement (Freeze FAIL)", "frozen job without a freeze_window lock",
                  "job before freeze_end not marked outside_freeze_window", "is_routed disagrees with status optimized"):
        report(f"{label}: {len(problems[label])}", not problems[label], problems[label])

    index_gaps, chain_breaks, missing_indexes, missing_chain = [], [], [], []
    for (schedule, day), stops in ctx.routes.items():
        if any(s["after"].get("route_stop_index") is None for s in stops):
            missing_indexes.append(f"{schedule}|{day}")
            continue
        if [s["after"].get("route_stop_index") for s in stops] != list(range(len(stops))):
            index_gaps.append(f"{schedule}|{day}")
        for first, second in zip(stops, stops[1:]):
            a, b = first["after"], second["after"]
            if any(k not in a for k in ("next_job_id", "to_next_distance_m", "to_next_drive_sec")) or any(k not in b for k in ("distance_m", "drive_sec")):
                missing_chain.append(f"{schedule}|{day}")
                continue
            if (str(a.get("next_job_id")) != str(second.get("job_id")) or a.get("to_next_distance_m") != b.get("distance_m")
                    or a.get("to_next_drive_sec") != b.get("drive_sec")):
                chain_breaks.append(f"{first.get('job_id')}->{second.get('job_id')}")
        if stops and "next_job_id" not in stops[-1]["after"]:
            missing_chain.append(f"{schedule}|{day}")
        elif stops and stops[-1]["after"].get("next_job_id") is not None:
            chain_breaks.append(f"{stops[-1].get('job_id')}->(last stop has next_job_id)")
    report("route_stop_index runs 0..n-1 per schedule/day",
           False if index_gaps else None if missing_indexes else True, index_gaps or missing_indexes)
    report("stop A next_job_id / to_next leg == stop B job / inbound leg",
           False if chain_breaks else None if missing_indexes or missing_chain else True,
           chain_breaks or missing_indexes or missing_chain)


def hours_section(ctx):
    service = ctx.features.get("default_service_hours") or {}
    if not service.get("active") or service.get("start_min") is None or service.get("end_min") is None:
        print("\nSERVICE HOURS [UNVERIFIABLE] features.default_service_hours missing or inactive")
        return
    travel = ctx.features.get("shift_travel_minutes") or {}
    shift_end = ctx.features.get("max_shift_end_time") or {}
    pre_post = (travel.get("minutes") or 0) if travel.get("active") else 0
    end_cap = service["end_min"]
    if shift_end.get("active") and shift_end.get("minutes") is not None:
        end_cap = min(end_cap, shift_end["minutes"])
    low, high = service["start_min"] + pre_post, end_cap - pre_post
    engine_low, engine_high = ctx.windows.get("operating_start_min"), ctx.windows.get("operating_end_min")
    print(f"\nSERVICE HOURS effective {hhmm(low)}-{hhmm(high)} from features (service {hhmm(service['start_min'])}-"
          f"{hhmm(service['end_min'])}, pre/post {pre_post} min, max shift end "
          f"{hhmm(shift_end.get('minutes')) if shift_end.get('active') else 'off'}); engine operating window "
          f"{hhmm(engine_low)}-{hhmm(engine_high)}")
    if engine_high is not None and engine_high < high:
        print("  [NOTE] engine operating_end is tighter than Service Hours / Max Shift End "
              "(Max Last Departure folded in as an end cap)")
    outside = []
    for job in ctx.jobs:
        after = side(job, "after")
        start, end = wall(after.get("start")), wall(after.get("end"))
        if not (start and end) or job.get("routing_status") == "outside_freeze_window":
            continue
        end_minute = minute_of_day(end) if end.date() == start.date() else 24 * 60
        if minute_of_day(start) < low or end_minute > high:
            outside.append(f"job {job.get('job_id')} {job.get('routing_status')} {start:%Y-%m-%d %H:%M}-{end:%H:%M}")
    for row in outside[: ctx.args.limit]:
        print(f"  [FLAG] {row} outside effective Service Hours")
    if not outside:
        print("  no non-frozen placement outside the effective Service Hours")


def route_section(ctx):
    args = ctx.args
    cutoff = clock_minutes(args.max_departure) if args.max_departure else None
    print("\nROUTES per schedule/day (after placement; miles/drive = sum of inbound legs; the stream has no return leg)")
    rows = []
    for (schedule, day), stops in sorted(ctx.routes.items(), key=lambda item: (item[0][1], item[0][0])):
        statuses = collections.Counter(s.get("routing_status") for s in stops)
        miles = sum(s["after"].get("distance_m") or 0 for s in stops) / METERS_PER_MILE
        minutes = sum(s["after"].get("drive_sec") or 0 for s in stops) / 60
        missing = sum(1 for s in stops if s["after"].get("distance_m") is None)
        frozen_day = ctx.honor_freeze and ctx.first_open is not None and dt.date.fromisoformat(day) < ctx.first_open
        last_start = max(wall(s["after"]["start"]) for s in stops)
        flags = []
        if args.max_distance_mi is not None and miles > args.max_distance_mi:
            flags.append(f"miles {miles:.2f} > {args.max_distance_mi:g}")
        if args.max_travel_min is not None and minutes > args.max_travel_min:
            flags.append(f"drive {minutes:.1f} min > {args.max_travel_min:g}")
        if cutoff is not None and minute_of_day(last_start) > cutoff:
            flags.append(f"last start {fmt_time(last_start)} after departure cutoff {hhmm(cutoff)}")
        elif cutoff is not None and minute_of_day(last_start) == cutoff:
            flags.append(f"last start {fmt_time(last_start)} == cutoff (OPEN QUESTION)")
        if flags and missing:
            flags.append(f"{missing} leg(s) missing: totals are lower bounds")
        if flags and not statuses.get("optimized"):
            flags.append("no optimized stop: pre-existing, OBSERVED")
        rows.append((schedule, day, stops, miles, minutes, missing, frozen_day, flags))
    open_rows = [row for row in rows if not row[6]]
    print(f"  open-day routes {len(open_rows)}: max jobs {max((len(r[2]) for r in open_rows), default=0)}, "
          f"max miles {max((r[3] for r in open_rows), default=0):.2f}, max drive {max((r[4] for r in open_rows), default=0):.1f} min, "
          f"routes with missing legs {sum(1 for r in open_rows if r[5])}; frozen-day routes {len(rows) - len(open_rows)}")
    for schedule, day, stops, miles, minutes, missing, frozen_day, flags in rows:
        if not flags:
            continue
        print(f"  [FLAG] schedule {schedule} {day}{' (frozen day)' if frozen_day else ''}: {'; '.join(flags)}")
        for stop in stops:
            after = stop["after"]
            print(f"      idx {after.get('route_stop_index')} job {stop.get('job_id')} {stop.get('routing_status')} "
                  f"{fmt_time(wall(after.get('start')))}-{fmt_time(wall(after.get('end')))} "
                  f"inbound {fmt_miles(after.get('distance_m'))} {fmt_drive(after.get('drive_sec'))}")


def capacity_section(ctx):
    """Max Jobs is per technician/day; recurring occurrences count separately."""
    if ctx.args.max_jobs is None:
        return
    print("\nCAPACITY per technician/day (all schedules combined; event occurrences)")
    groups = collections.defaultdict(list)
    unknown = set()
    for (schedule, day), stops in ctx.routes.items():
        technician = ctx.technician(schedule)
        if technician is None:
            unknown.add(schedule)
            continue
        groups[(technician, day)].extend(stops)
    if unknown:
        print(f"  [UNVERIFIABLE] capacity: missing/ambiguous technician mapping for schedules {sorted(unknown)}")
    for (technician, day), stops in sorted(groups.items()):
        events = collections.defaultdict(list)
        missing = 0
        for stop in stops:
            event = stop.get("event_id")
            if event is None:
                missing += 1
            else:
                events[str(event)].append(stop)
        duplicate = sorted(event for event, rows in events.items() if len(rows) > 1)
        if duplicate or missing:
            print(f"  [UNVERIFIABLE] technician {technician} {day}: duplicate events {duplicate}; missing event IDs {missing}")
        count = len(events)
        schedules = sorted({str(stop['after'].get('schedule_id')) for stop in stops})
        detail = f"technician {technician} {day} schedules={schedules} distinct events={count} cap={ctx.args.max_jobs}"
        if count > ctx.args.max_jobs:
            # Duplicate placements need reconciliation before classifying their contribution.
            tag = "UNVERIFIABLE" if duplicate else "FLAG" if any(s.get("routing_status") == "optimized" for s in stops) else "NOTE"
            suffix = "reconcile duplicate events" if duplicate else "over cap" if tag == "FLAG" else "pre-existing overload (OBSERVED)"
            print(f"  [{tag}] {detail}: {suffix}")
        else:
            print(f"  [NOTE] {detail}: observed count only; verify complete tech-day scope before PASS")


def identity_section(ctx):
    schedules = sorted({str(side(j, n).get("schedule_id")) for j in ctx.jobs for n in ("before", "after")
                        if side(j, n).get("schedule_id") is not None})
    known = {s: sorted(ctx.technicians[s]) for s in schedules if ctx.technicians.get(s)}
    unknown = [s for s in schedules if not ctx.technicians.get(s)]
    print(f"\nTECHNICIANS schedule → non-zero user_id: {known}; unknown: {unknown}")
    by_user = collections.defaultdict(list)
    for schedule, users in known.items():
        if len(users) == 1:
            by_user[users[0]].append(schedule)
    shared = {user: s for user, s in by_user.items() if len(s) > 1}
    if shared:
        print(f"  schedules sharing one technician: {shared}")
    several = {s: u for s, u in known.items() if len(u) > 1}
    if several:
        print(f"  [NOTE] schedules with several user ids (treated as unknown): {several}")


def move_line(job, before, after, delta):
    return (f"job {job.get('job_id')} event {job.get('event_id')} {job.get('routing_status')}: "
            f"{before:%a %Y-%m-%d %H:%M} s{side(job, 'before').get('schedule_id')} → "
            f"{after:%a %Y-%m-%d %H:%M} s{side(job, 'after').get('schedule_id')} Δ{delta}d")


def move_section(ctx):
    args = ctx.args
    horizon_end = ctx.horizon_end.date() if ctx.horizon_end else None
    stats, plain, marked, max_delta = collections.Counter(), [], [], 0
    for job in ctx.jobs:
        before, after = side(job, "before"), side(job, "after")
        if not (before.get("start") and after.get("start")):
            continue
        if before["start"] == after["start"] and str(before.get("schedule_id")) == str(after.get("schedule_id")):
            continue
        b, a = wall(before["start"]), wall(after["start"])
        delta = abs((a.date() - b.date()).days)
        max_delta = max(max_delta, delta)
        week_cross = week_start(b.date()) != week_start(a.date())
        month_cross = (b.year, b.month) != (a.year, a.month)
        stats["moved"] += 1
        stats["date changed"] += delta > 0
        stats["Sun-Sat week crossed"] += week_cross
        stats["month crossed"] += month_cross
        flags, unknown, notes = [], [], []
        if args.restrict is not None and delta > args.restrict:
            flags.append(f"moves {delta} days > ±{args.restrict}")
        if args.keep == "week" and week_cross:
            flags.append(f"leaves Sun-Sat week starting {week_start(b.date())}")
        if args.keep == "month" and month_cross:
            flags.append("leaves its calendar month")
        if ctx.honor_freeze and ctx.first_open and (b.date() < ctx.first_open or a.date() < ctx.first_open):
            before_tech = ctx.technician(before.get("schedule_id"))
            after_tech = ctx.technician(after.get("schedule_id"))
            if b != a or (before_tech is not None and after_tech is not None and before_tech != after_tech):
                flags.append("placement on a frozen day changed (Freeze)")
            elif before_tech is None or after_tech is None:
                unknown.append("Freeze technician identity missing")
        if horizon_end and a.date() > horizon_end:
            notes.append("after horizon end (overflow, not FAIL alone)")
        window = constraints(job).get("move_window") or {}
        low, high = wall_unix(window.get("earliest_unix")), wall_unix(window.get("latest_unix"))
        if low and high and not low <= a <= high:
            notes.append(f"outside engine move_window {low:%m-%d %H:%M}..{high:%m-%d %H:%M}; map to confirmed rule before FAIL")
        if str(before.get("schedule_id")) != str(after.get("schedule_id")):
            stats["schedule changed"] += 1
            tech_before, tech_after = ctx.technician(before.get("schedule_id")), ctx.technician(after.get("schedule_id"))
            if tech_before and tech_after and tech_before == tech_after:
                stats["same technician"] += 1
                notes.append(f"same technician {tech_after}")
            elif tech_before and tech_after:
                stats["technician changed"] += 1
                (flags if args.cross_tech == "off" else notes).append(f"technician {tech_before} → {tech_after}")
            else:
                stats["technician unknown"] += 1
                (unknown if args.cross_tech == "off" else notes).append("technician unknown (no schedule → user mapping)")
        row = (job, b, a, delta, flags, unknown, notes)
        (marked if flags or unknown else plain).append(row)
    print(f"\nMOVES before≠after: {dict(stats)}; max |day delta| {max_delta}")
    for job, b, a, delta, flags, unknown, notes in marked:
        tag = "FLAG" if flags else "UNVERIFIABLE"
        print(f"  [{tag}] {move_line(job, b, a, delta)} | {'; '.join(flags + unknown + notes)}")
    for job, b, a, delta, flags, unknown, notes in plain[: args.limit]:
        print(f"  {move_line(job, b, a, delta)}{' | ' + '; '.join(notes) if notes else ''}")
    if len(plain) > args.limit:
        print(f"  … {len(plain) - args.limit} more unflagged moves")


def custom_section(ctx):
    jobs = ctx.jobs
    signals = ctx.summary.get("custom_rule_signal_counts") or {}
    locks = collections.Counter(constraints(j).get("lock_reason") for j in jobs if constraints(j).get("locked"))
    print(f"\nCUSTOM RULE SIGNALS summary={json.dumps(signals)} locks by reason={dict(locks)}")
    print("  recount excludes freeze_window/route_around locks (freeze exclusion verified; others unverified → DIFF means investigate)")
    recount = {
        "locked": sum(1 for j in jobs if constraints(j).get("locked") and constraints(j).get("lock_reason") not in FIXED_LOCK_REASONS),
        "forced_tech": sum(1 for j in jobs if present(constraints(j).get("forced_user_id"))),
        "preferred_tech": sum(1 for j in jobs if present(constraints(j).get("preferred_user_id"))),
        "hard_arrival_window": sum(1 for j in jobs if present(constraints(j).get("hard_arrival_window"))),
        "soft_arrival_window": sum(1 for j in jobs if present(constraints(j).get("soft_arrival_window"))),
        "conflict": sum(1 for j in jobs if present(constraints(j).get("conflict_rule_ids"))),
    }
    for key, value in recount.items():
        if key in signals:
            print(f"  [{'OK' if signals[key] == value else 'DIFF'}] {key}: summary {signals[key]} vs recount {value}")
    fields = ("forced_user_id", "forced_rule_id", "preferred_user_id", "preferred_rule_id", "position_constraint",
              "position_rule_id", "hard_arrival_window", "soft_arrival_window", "conflict_rule_ids", "custom_rule_soft")
    shown = 0
    for job in jobs:
        applied = constraints(job)
        touched = {k: applied.get(k) for k in fields if present(applied.get(k))}
        if applied.get("locked") and applied.get("lock_reason") not in FIXED_LOCK_REASONS:
            touched["locked"] = applied.get("lock_reason")
        if not touched:
            continue
        after = side(job, "after")
        issues, checks, unknown = [], [], []
        assigned = ctx.technician(after.get("schedule_id"))
        if present(applied.get("forced_user_id")) and after:
            if assigned is None:
                unknown.append("forced technician: missing/ambiguous assigned identity")
            elif str(assigned) == str(applied["forced_user_id"]):
                checks.append("forced == assigned")
            else:
                issues.append(f"forced {applied['forced_user_id']} but assigned {assigned}")
        position = str(applied.get("position_constraint") or "").lower()
        if position.startswith("first") and after:
            if after.get("route_stop_index") is None:
                unknown.append("first stop: missing route_stop_index")
            elif after["route_stop_index"] != 0:
                issues.append(f"first stop but route_stop_index {after['route_stop_index']}")
        if position.startswith("last") and after:
            if "next_job_id" not in after:
                unknown.append("last stop: missing next_job_id")
            elif after["next_job_id"] is not None:
                issues.append(f"last stop but next_job_id {after['next_job_id']}")
        if shown < ctx.args.limit or issues or unknown:
            tag = "[FLAG] " if issues else "[UNVERIFIABLE] " if unknown else ""
            print(f"  {tag}job {job.get('job_id')} {job.get('routing_status')} {json.dumps(touched, default=str)[:200]} "
                  f"{'; '.join(issues + unknown + checks)}")
        shown += 1
    if shown > ctx.args.limit:
        print(f"  … {shown} jobs carry custom constraints")


def arrival_section(ctx):
    feature = ctx.features.get("arrival_window_duration_override") or {}
    hours = feature.get("hours") or ctx.resolved.get("arrival_window_hours")
    if not feature.get("active") or not hours:
        return
    half = dt.timedelta(minutes=float(hours) * 30)
    service = ctx.features.get("default_service_hours") or {}
    tally, examples = collections.Counter(), []
    for job in ctx.jobs:
        after = side(job, "after")
        if job.get("routing_status") != "optimized" or not after.get("start"):
            continue
        start, end = wall(after["start"]), wall(after.get("end"))
        window = after.get("time_window") or {}
        shown = (wall(window.get("start")), wall(window.get("end")))
        if None in shown:
            tally["UNVERIFIABLE: missing displayed window"] += 1
            continue
        if service.get("start_min") is None or service.get("end_min") is None:
            tally["UNVERIFIABLE: missing service hours for clamp"] += 1
            continue
        hours_ = job.get("work_hours") or {}
        midnight = start.replace(hour=0, minute=0, second=0)
        low = midnight + dt.timedelta(minutes=service["start_min"])
        high = midnight + dt.timedelta(minutes=service["end_min"])
        sheet = (max(start - half, low), min(start + half, high))
        if shown == sheet:
            tally["sheet: start±H/2 clamped to service hours"] += 1
            continue
        if end and shown == (start - half, end + half):
            tally["observed: [start-H/2, end+H/2] unclamped (OPEN QUESTION)"] += 1
        else:
            tally["neither formula (FAIL candidate)"] += 1
        if len(examples) < 3:
            examples.append(f"job {job.get('job_id')} {fmt_time(start)}-{fmt_time(end)} shown "
                            f"{fmt_time(shown[0])}-{fmt_time(shown[1])} sheet {fmt_time(sheet[0])}-{fmt_time(sheet[1])}")
    print(f"\nARRIVAL WINDOW override {hours}h, optimized jobs after.time_window: {dict(tally)}")
    for example in examples:
        print(f"  {example}")


def unassigned_section(ctx):
    rows = [j for j in ctx.jobs if j.get("routing_status") == "unassigned"]
    if not rows:
        return
    reasons = collections.Counter(j.get("routing_status_reason") for j in rows)
    days = collections.Counter(str(side(j, "before").get("start") or "none")[:10] for j in rows)
    print(f"\nUNASSIGNED {len(rows)} by reason {dict(reasons)}; by before date {dict(sorted(days.items()))}")
    print("  the stream does not name the blocking rule: acceptable only when no valid slot exists")


def main():
    args = parse_args()
    text = pathlib.Path(args.capture).read_text(encoding="utf-8", errors="replace")
    objects = load_objects(text)
    terminals = [obj for obj in objects if obj.get("type") == "completed"]
    if not terminals:
        print("RUN no `completed` event found: the run is UNVERIFIABLE")
        return 1
    if len(terminals) != 1:
        print("RUN multiple `completed` events: UNVERIFIABLE; split captures by run before auditing")
        return 1
    completed = terminals[0]
    if completed.get("success") is not True or not completed.get("feature_test_log"):
        print("RUN unsuccessful or missing feature_test_log: UNVERIFIABLE; inspect available raw fields separately")
        return 1
    ctx = Context(args, objects, completed)
    for section in (run_section, config_section, window_section, invariant_section, hours_section, route_section,
                    identity_section, capacity_section, move_section, custom_section, arrival_section, unassigned_section):
        section(ctx)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
