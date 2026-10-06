# Autonomous Mantis API Verification Plan

Generated: 2026-08-22

## Goal
Run and analyze Mantis Routing / Sandbox / Route Optimizer APIs without waiting for user prompts.

## Current lane: corrected CSV-driven pilot

- Suite: `scripts/csv-corrected-60-scenarios.json`
- Source data:
  - `data/module-rules-testcases.csv` — 792 cases
  - `data/cross-module-combos.csv` — 663 cases
- Runner: `scripts/run-scenario.py`
- Current PID at plan creation: `86489`
- Safety: single mutating runner only; never start second runner while `.runner.lock` exists.

## Execution rules

1. Check active runner:
   - `ps -p <pid>`
   - `pgrep -af "run-scenario.py|mantis-routing/scripts"`
   - `captures/.runner.lock`
   - `captures/matrix-results.json`
2. If runner active: only monitor, analyze previous completed captures, optionally commit safe completed files.
3. If runner finished:
   - verify no `.runner.lock`
   - read `captures/csv-corrected-60-*.err`
   - run restore:
     `/Users/chanhtran/.claude/skills/.venv/bin/python3 scripts/run-scenario.py restore`
   - generate corrected report.
4. Analyze raw API layers, never one field only:
   - `jobs before/optimized`: job id set, added, missing, date_label, start, end, schedule_id, length
   - `drive_time before/optimized`: segment ids/order/start/end/value/unit
   - `route before/optimized`: schedule/day keys and polyline hash changes
   - `stats daily/total`: compare against raw jobs/drive sums
   - feeds/history/logs if accept flow is used
5. Verdict discipline:
   - `PASS` only if setup read-back correct and raw response proves expected behavior.
   - `SETUP_FAIL` if config read-back mismatches intended payload.
   - `REACHES_ENGINE` if drive/route changed but job placement proof is missing.
   - `INCONSISTENT_RESPONSE` if jobs/drive/routes/stats disagree.
   - `BLOCKED_CONTRACT` if API does not expose enough placement/explainability.
6. Commit/push every meaningful chunk to `origin/main`, excluding credentials/tokens.

## After corrected 60

- If setup read-back is mostly valid: generate next CSV-driven batch of 200–300 cases.
- If setup invalid: patch generator mapping first, rerun corrected pilot.
- Custom Rules / Day Exclusions require separate lane with create/delete/cleanup + accept/undo evidence.

## Git safety

- `.gitignore` must keep:
  - `captures/.env.local`
  - `captures/.runner.lock`
- Before each push, check:
  - `git ls-files --others --exclude-standard | grep -E '(\.env|env\.local|token|secret)' || true`
  - do not commit secrets.
