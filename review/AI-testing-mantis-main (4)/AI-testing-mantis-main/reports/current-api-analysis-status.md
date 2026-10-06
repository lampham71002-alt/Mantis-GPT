# Current API Analysis Status

Generated: `2026-08-22T20:17:18`

## Runner status

- Active runner: `scripts/run-scenario.py scripts/csv-corrected-240-scenarios.json`
- PID/lock: `91776`
- Completed in matrix: `80 / 240` successful d* captures; errors `0`

## Corrected 240 expanded (`d*`)

| Metric | Value |
|---|---:|
| Completed so far | 80 / 240 |
| Progress | 33.3% |
| API/setup errors | 0 |
| Setup read-back OK | 80 |
| Setup read-back failed | 0 |
| Job placement changed cases | 0 |
| Drive-time changed cases | 80 |
| Route changed cases | 80 |
| Stats jobs_assigned mismatch | 0 |
| Stats work_time mismatch | 80 |

## Verdict counts

| Verdict | Count |
|---|---:|
| `REACHES_ENGINE` | 80 |

## Drive delta distribution

| Δ drive_time optimized-before | Count |
|---:|---:|
| -26.8 | 1 |
| 77.9 | 79 |

## Latest finished matrix rows

| Case | Verdict | Setup | Jobs b→o | Job changes | Drive b→o | Δdrive | Route changes | Capture |
|---|---|---|---:|---:|---:|---:|---:|---|
| `d065-workforce-boundaries-128-preferred-jobs-per-day-15-max` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200245-d065-workforce-boundaries-128-preferred-jobs-per-day-15-max` |
| `d066-workforce-boundaries-129-pre-post-shift-travel-30min-e` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200327-d066-workforce-boundaries-129-pre-post-shift-travel-30min-e` |
| `d067-workforce-boundaries-130-pre-post-shift-travel-total-e` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200430-d067-workforce-boundaries-130-pre-post-shift-travel-total-e` |
| `d068-workforce-boundaries-131-service-hours-end-6pm-max-shi` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200537-d068-workforce-boundaries-131-service-hours-end-6pm-max-shi` |
| `d069-workforce-boundaries-133-max-jobs-per-day-0` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200640-d069-workforce-boundaries-133-max-jobs-per-day-0` |
| `d070-workforce-boundaries-134-preferred-jobs-per-day-0` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200725-d070-workforce-boundaries-134-preferred-jobs-per-day-0` |
| `d071-workforce-boundaries-note-combos-that-do-not-have-defa` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200831-d071-workforce-boundaries-note-combos-that-do-not-have-defa` |
| `d072-route-efficiency-3-max-travel-distance-10mi` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-200937-d072-route-efficiency-3-max-travel-distance-10mi` |
| `d073-route-efficiency-4-max-shift-travel-120min` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201021-d073-route-efficiency-4-max-shift-travel-120min` |
| `d074-route-efficiency-8-skill-matching-on` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201127-d074-route-efficiency-8-skill-matching-on` |
| `d075-route-efficiency-10-min-travel-time-5min-max-travel-di` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201233-d075-route-efficiency-10-min-travel-time-5min-max-travel-di` |
| `d076-route-efficiency-11-min-travel-time-5min-max-shift-tra` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201305-d076-route-efficiency-11-min-travel-time-5min-max-shift-tra` |
| `d077-route-efficiency-15-min-travel-time-5min-skill-matchin` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201412-d077-route-efficiency-15-min-travel-time-5min-skill-matchin` |
| `d078-route-efficiency-16-min-travel-distance-0-5mi-max-trav` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201518-d078-route-efficiency-16-min-travel-distance-0-5mi-max-trav` |
| `d079-route-efficiency-17-min-travel-distance-0-5mi-max-shif` | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-201554-d079-route-efficiency-17-min-travel-distance-0-5mi-max-shif` |

## Current interpretation

- Expanded d* runner is still active; no second mutating runner was started.
- Setup read-back remains valid for every finished d* case in matrix so far.
- As in c* pilot, raw `jobs.before` vs `jobs.optimized` still shows no job-id/date/start/end/schedule/length movement in completed d* cases.
- `drive_time` and `route` continue changing, so these cases are `REACHES_ENGINE` rather than full placement `PASS`.
- Keep runner alive; restore/report/full commit should happen only after lock clears.

## Files

- JSON: `reports/d240-partial-raw-analysis.json`
- Markdown/status: `reports/current-api-analysis-status.md`
