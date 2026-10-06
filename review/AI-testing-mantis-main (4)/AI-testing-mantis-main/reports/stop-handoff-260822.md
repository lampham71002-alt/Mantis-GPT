# Mantis API Verification Stop Handoff — 2026-08-22

## Stop status

User requested to stop and continue tomorrow.

- Active runner `csv-corrected-240` was stopped.
- Autonomous cron driver was paused: `8f045228dadd`.
- Stale runner lock was removed.
- Baseline restored successfully: `failed: []`.

## Final progress today

| Batch | Progress | Errors | Notes |
|---|---:|---:|---|
| `c*` corrected pilot | 60 / 60 = 100% | 0 | completed and analyzed |
| `d*` corrected expanded | 205 / 240 = 85.4% | 0 | stopped at user request |

Last completed `d*` case:

```txt
d204-service-commitments-34-arrival-window-duration-overrid
```

## Latest findings

- Corrected payload mapping is valid so far: no setup/API errors in `c60` or completed `d205`.
- Raw `jobs.optimized` still does not expose placement changes in analyzed completed cases.
- `drive_time` and `route` chunks change consistently.
- Verdict remains:
  - setup: `SETUP_PASS`
  - drive/route layer: `REACHES_ENGINE`
  - job placement correctness: `BLOCKED_CONTRACT` until jobs move/add/remove/day/start/end/schedule changes are exposed or accept/feed logs explain no-move outcomes.

## Tomorrow resume plan

1. Confirm no runner/lock:
   ```bash
   pgrep -af "run-scenario.py|mantis-routing/scripts" || true
   test -f captures/.runner.lock && cat captures/.runner.lock || echo NO_LOCK
   ```
2. Restore baseline before any run:
   ```bash
   /Users/chanhtran/.claude/skills/.venv/bin/python3 scripts/run-scenario.py restore
   ```
3. Resume or rerun remaining corrected CSV cases:
   - Current stopped suite: `scripts/csv-corrected-240-scenarios.json`
   - Completed: `d000` through `d204`
   - Remaining logical range: `d205` through `d239`
4. Generate full deep report for completed `c*` + `d*` captures.
5. Start accept/feed/undo lane if `jobs.optimized` continues to hide placement changes.

## Safety

- Do not start two mutating runners.
- Keep `captures/.env.local` and `.runner.lock` ignored.
- Redact tokens in reports/curls.
