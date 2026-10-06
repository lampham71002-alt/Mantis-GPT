# Corrected cross-240 interim raw API analysis

Generated while runner PID 8396 is still active; no restore or next runner started.

## Scope
- Scenario file: `scripts/csv-corrected-cross-240-scenarios.json`
- Completed e* captures analyzed: 143 of 240 planned
- First/last complete: `260823-091526-e000-control-future-cross-csv` / `260823-111241-e142-4-key-cross-141-max-shift-end-time-6pm-max-travel-dist`
- Raw layers inspected per capture: setup config subset read-back, jobs before/optimized, drive_time before/optimized, route before/optimized, total stats.

## Setup read-back
- Expected config subset matched in 143/143 completed captures.
- No setup subset mismatches found against scenario config for completed captures.

## Verdict distribution
- REACHES_ENGINE: 143

## Aggregate raw-response observations
- Jobs: all completed captures returned before/optimized job counts around [((212, 212), 142), ((83, 83), 1)].
- Job placement changes: min=0, max=0, nonzero=0.
- Drive delta minutes: min=-26.8, max=576.6, nonzero=143; common=[(77.9, 106), (576.6, 36), (-26.8, 1)].
- Route changed days: min=1, max=6, nonzero=143.
- Drive job-id set equality false count: 143 / 143.
- Stats jobs_assigned common: [((212, 212), 142), ((83, 83), 1)].

## Latest complete captures
| name | capture | setup | jobs changed | drive sum before→after | route changed | verdict |
|---|---|---:|---:|---:|---:|---|
| `e133-4-key-cross-132-max-shift-end-time-6pm-max-travel-dist` | `260823-110729-e133-4-key-cross-132-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |
| `e134-4-key-cross-133-max-shift-end-time-6pm-max-travel-dist` | `260823-110803-e134-4-key-cross-133-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |
| `e135-4-key-cross-134-max-shift-end-time-6pm-max-travel-dist` | `260823-110841-e135-4-key-cross-134-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |
| `e136-4-key-cross-135-max-shift-end-time-6pm-max-travel-dist` | `260823-110917-e136-4-key-cross-135-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |
| `e137-4-key-cross-136-max-shift-end-time-6pm-max-travel-dist` | `260823-110951-e137-4-key-cross-136-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |
| `e138-4-key-cross-137-max-shift-end-time-6pm-max-travel-dist` | `260823-111025-e138-4-key-cross-137-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→4375.1 | 6 | REACHES_ENGINE |
| `e139-4-key-cross-138-max-shift-end-time-6pm-max-travel-dist` | `260823-111059-e139-4-key-cross-138-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→4375.1 | 6 | REACHES_ENGINE |
| `e140-4-key-cross-139-max-shift-end-time-6pm-max-travel-dist` | `260823-111133-e140-4-key-cross-139-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→4375.1 | 6 | REACHES_ENGINE |
| `e141-4-key-cross-140-max-shift-end-time-6pm-max-travel-dist` | `260823-111206-e141-4-key-cross-140-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→4375.1 | 6 | REACHES_ENGINE |
| `e142-4-key-cross-141-max-shift-end-time-6pm-max-travel-dist` | `260823-111241-e142-4-key-cross-141-max-shift-end-time-6pm-max-travel-dist` | OK | 0 | 3798.5→3876.4 | 6 | REACHES_ENGINE |

## Interim conclusion
The corrected cross-240 setup read-back is valid so far, but completed cases continue to show no job placement changes in optimized jobs. Most cases still reach the optimizer layer through drive_time/route/stat changes, so current interim verdict is predominantly `REACHES_ENGINE`, not `PASS`, until raw optimized jobs prove expected placement behavior or the API contract exposes stronger explainability.
