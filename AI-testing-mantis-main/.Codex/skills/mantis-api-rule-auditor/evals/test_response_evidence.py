"""Offline regression fixtures; these are not live Mantis test results.

Run: python3 -m unittest discover -s <skill>/evals -p 'test_*.py' -v
"""
import argparse
import contextlib
import datetime as dt
import importlib.util
import io
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest


SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "summarize-jobs-stream.py"
SPEC = importlib.util.spec_from_file_location("evidence", SCRIPT)
evidence = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(evidence)


def unix(day):
    return dt.datetime.fromisoformat(day).replace(tzinfo=dt.timezone.utc).timestamp()


def job(event, schedule, before="2026-09-19T09:00:00+00:00", after=None, job_id=None):
    return {
        "event_id": event, "job_id": job_id if job_id is not None else event,
        "routing_status": "optimized", "is_routed": True,
        "before": {"schedule_id": schedule, "start": before},
        "after": {"schedule_id": schedule, "start": after or before,
                  "end": "2026-09-19T10:00:00+00:00", "route_stop_index": 0,
                  "next_job_id": None, "distance_m": 100, "drive_sec": 60},
    }


def context(jobs, mapping=None, mode="sandbox", **overrides):
    args = dict(today=None, mode=mode, max_jobs=10, max_distance_mi=None,
                max_travel_min=None, max_departure=None, restrict=None, keep=None,
                cross_tech=None, limit=15)
    args.update(overrides)
    log = {
        "jobs": jobs,
        "windows": {"horizon_start_unix": unix("2026-09-18"),
                    "horizon_end_unix": unix("2026-09-25") - 1,
                    "freeze_end_unix": unix("2026-09-19"), "honor_freeze": True},
        "features": {"freeze_window": {"days": 1}, "optimization_horizon": {"value": "7_days"}},
    }
    frames = [{"type": "events", "items": [
        {"schedule": {"id": s, "user_id": t}} for s, t in (mapping or {}).items()
    ]}]
    terminal = {"type": "completed", "success": True, "feature_test_log": log}
    return evidence.Context(argparse.Namespace(**args), frames, terminal)


def output(section, ctx):
    result = io.StringIO()
    with contextlib.redirect_stdout(result):
        section(ctx)
    return result.getvalue()


class CapacityTests(unittest.TestCase):
    def test_shared_technician_overload_across_schedules(self):
        jobs = [job(n, 1 if n < 7 else 2) for n in range(14)]
        result = output(evidence.capacity_section, context(jobs, {1: 90, 2: 90}))
        self.assertIn("[FLAG] technician 90", result)
        self.assertIn("distinct events=14 cap=10", result)

    def test_different_technicians_do_not_combine(self):
        jobs = [job(n, 1 if n < 7 else 2) for n in range(14)]
        result = output(evidence.capacity_section, context(jobs, {1: 90, 2: 91}))
        self.assertNotIn("[FLAG]", result)
        self.assertEqual(result.count("distinct events=7"), 2)

    def test_recurring_job_occurrences_count_separately(self):
        jobs = [job(n, 1, job_id=1000) for n in range(11)]
        result = output(evidence.capacity_section, context(jobs, {1: 90}))
        self.assertIn("distinct events=11 cap=10", result)
        self.assertIn("[FLAG]", result)

    def test_duplicates_do_not_manufacture_capacity_failure(self):
        jobs = [job(n, 1) for n in range(10)] + [job(1, 1)]
        result = output(evidence.capacity_section, context(jobs, {1: 90}))
        self.assertIn("[UNVERIFIABLE]", result)
        self.assertIn("distinct events=10", result)
        self.assertNotIn("[FLAG]", result)

    def test_missing_mapping_is_not_pass(self):
        result = output(evidence.capacity_section, context([job(1, 2)]))
        self.assertIn("[UNVERIFIABLE] capacity", result)
        self.assertNotIn("PASS", result)

    def test_preexisting_overload_is_observed(self):
        jobs = [job(n, 1) for n in range(11)]
        for item in jobs:
            item["routing_status"] = "unchanged"
        result = output(evidence.capacity_section, context(jobs, {1: 90}))
        self.assertIn("pre-existing overload (OBSERVED)", result)
        self.assertNotIn("[FLAG]", result)


class RoutingTests(unittest.TestCase):
    def test_sunday_week_definition(self):
        start = evidence.week_start(dt.date(2026, 9, 20))
        self.assertEqual(start, evidence.week_start(dt.date(2026, 9, 21)))
        self.assertNotEqual(start, evidence.week_start(dt.date(2026, 9, 19)))

    def test_overflow_still_checks_restrict(self):
        ctx = context([job(1, 1, after="2026-09-27T09:00:00+00:00")], {1: 90}, restrict=2)
        result = output(evidence.move_section, ctx)
        self.assertIn("moves 8 days > ±2", result)
        self.assertIn("overflow, not FAIL alone", result)

    def test_manual_does_not_apply_autopilot_gate(self):
        item = job(1, 1, before="2026-09-18T09:00:00+00:00", after="2026-09-18T10:00:00+00:00")
        ctx = context([item], {1: 90}, mode="manual")
        self.assertNotIn("[FLAG]", output(evidence.move_section, ctx))
        self.assertIn("assertions skipped", output(evidence.window_section, ctx))

    def test_sandbox_frozen_before_cannot_move_to_open_day(self):
        item = job(1, 1, before="2026-09-18T09:00:00+00:00", after="2026-09-19T09:00:00+00:00")
        self.assertIn("(Freeze)", output(evidence.move_section, context([item], {1: 90})))

    def test_frozen_same_technician_schedule_change_is_not_freeze_failure(self):
        item = job(1, 1, before="2026-09-18T09:00:00+00:00")
        item["after"]["schedule_id"] = 2
        result = output(evidence.move_section, context([item], {1: 90, 2: 90}))
        self.assertNotIn("[FLAG]", result)

    def test_missing_arrival_window_is_not_a_formula_violation(self):
        ctx = context([job(1, 1)])
        ctx.features["arrival_window_duration_override"] = {"active": True, "hours": 2}
        result = output(evidence.arrival_section, ctx)
        self.assertIn("UNVERIFIABLE: missing displayed window", result)
        self.assertNotIn("FAIL candidate", result)

    def test_cross_tech_off_allows_same_technician_schedule_change(self):
        item = job(1, 1)
        item["after"]["schedule_id"] = 2
        result = output(evidence.move_section, context([item], {1: 90, 2: 90}, cross_tech="off"))
        self.assertIn("same technician 90", result)
        self.assertNotIn("[FLAG]", result)

    def test_unknown_forced_technician_not_violation(self):
        item = job(1, 1)
        item["constraints_applied"] = {"forced_user_id": 90, "forced_rule_id": 4}
        result = output(evidence.custom_section, context([item]))
        self.assertIn("[UNVERIFIABLE]", result)
        self.assertNotIn("[FLAG]", result)

    def test_engine_window_is_not_an_independent_business_rule(self):
        item = job(1, 1, after="2026-09-20T09:00:00+00:00")
        item["constraints_applied"] = {"move_window": {
            "earliest_unix": unix("2026-09-19"), "latest_unix": unix("2026-09-20")}}
        result = output(evidence.move_section, context([item], {1: 90}))
        self.assertIn("map to confirmed rule before FAIL", result)
        self.assertNotIn("[FLAG]", result)


class CaptureTests(unittest.TestCase):
    def test_package_runs_after_copy_without_original_workspace(self):
        with tempfile.TemporaryDirectory() as directory:
            package = pathlib.Path(directory) / "team-skill"
            shutil.copytree(SCRIPT.parents[1], package, ignore=shutil.ignore_patterns("__pycache__"))
            lookup = subprocess.run([sys.executable, str(package / "scripts" / "find-sheet-case.py"),
                                     "Keep Week", "--tab", "sheet-c-routing-rules", "--limit", "1"],
                                    cwd=directory, capture_output=True, text=True)
            self.assertEqual(lookup.returncode, 0, lookup.stderr)
            self.assertIn("sheet-c-routing-rules:", lookup.stdout)
            capture = pathlib.Path(directory) / "fixture.ndjson"
            ctx = context([job(n, 1 if n < 7 else 2) for n in range(14)], {1: 90, 2: 90})
            capture.write_text("\n".join(json.dumps(frame) for frame in ctx.objects + [ctx.completed]))
            run = subprocess.run([sys.executable, str(package / "scripts" / "summarize-jobs-stream.py"),
                                  str(capture), "--max-jobs", "10", "--mode", "sandbox"],
                                 cwd=directory, capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertIn("[FLAG] technician 90", run.stdout)
            self.assertIn("distinct events=14 cap=10", run.stdout)

    def test_pretty_sse_preserves_multiple_runs(self):
        terminal = {"success": True, "type": "completed", "feature_test_log": {"jobs": []}}
        stream = "\n".join("data: " + line for line in json.dumps(terminal, indent=2).splitlines())
        parsed = evidence.load_objects(stream + "\n\n" + stream)
        self.assertEqual(len(parsed), 2)

    def test_missing_summary_fields_are_not_contradictions(self):
        result = output(evidence.invariant_section, context([]))
        self.assertIn("[UNVERIFIABLE]", result)
        self.assertNotIn("[MISMATCH]", result)

    def test_cli_refuses_mixed_runs_from_unrelated_working_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            capture = pathlib.Path(directory) / "fixture.ndjson"
            terminal = {"type": "completed", "success": True, "feature_test_log": {"jobs": []}}
            capture.write_text((json.dumps(terminal) + "\n") * 2)
            run = subprocess.run([sys.executable, str(SCRIPT), str(capture)], cwd=directory,
                                 capture_output=True, text=True)
        self.assertEqual(run.returncode, 1)
        self.assertIn("split captures by run", run.stdout)


if __name__ == "__main__":
    unittest.main()
