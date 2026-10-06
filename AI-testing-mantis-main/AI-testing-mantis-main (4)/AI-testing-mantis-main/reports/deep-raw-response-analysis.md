# Mantis Deep Raw Response Analysis

Generated: `2026-08-22T17:48:10`

## Data corpus read

| File | Rows | Purpose |
|---|---:|---|
| `data/module-rules-testcases.csv` | 792 | Module-level expected behavior: Workforce Boundaries, Route Efficiency, Service Commitments, Custom Rules combos |
| `data/cross-module-combos.csv` | 663 | Cross-module WB + RE + SC + CR conflict/priority cases |
| **Total expected cases** | **1455** | Full expected corpus |

These two files were not read before the earlier bulk summary. They are now read and used as the expected-behavior oracle. Important: the already-run bulk 450 suite is **not a faithful execution of all 1,455 CSV cases**; it was generated from separate system/filter combinations and had payload-key mismatches. So the 450 run is valid as API-load/raw-response evidence, but not enough as final rule-corpus verdict.

## Raw response layers inspected

For every successful `manual/optimize` stream, the analyzer read these API chunks directly from `optimize.ndjson`:

- `type=jobs, scope=before`
- `type=drive_time, scope=before`
- `type=route, scope=before`
- `type=jobs, scope=optimized`
- `type=drive_time, scope=optimized`
- `type=route, scope=optimized`
- `type=stats, scope=daily|total`

## Aggregate results from raw chunks

| Check | Count | Meaning |
|---|---:|---|
| Successful optimize streams | 292 | Raw `optimize.ndjson` captures available |
| Job placement changed cases | 0 | Any job added/removed OR changed `start/end/date_label/schedule_id/length` |
| Drive-time changed cases | 292 | Segment value/time/order/job-id set changed |
| Route polyline changed cases | 292 | Route chunk payload changed by schedule/day |
| Stats work-time mismatch cases | 292 | `stats.work_time.after` does not equal sum of optimized job lengths |
| Stats drive-time mismatch cases | 292 | `stats.drive_time.after` does not equal sum of optimized drive segments |

## Correct interpretation

Anh đúng: a job can legitimately move to another date, be removed from a date, or be added to a date. So the correct check is not a single `jobs_moved` count. The analyzer now compares the raw job universe and classifies:

- same/different job-id set
- missing jobs from optimized
- added jobs in optimized
- date/day changes
- start/end changes
- schedule/tech changes
- length changes

In the current 292 successful captures, raw jobs still show **0 placement changes** by those criteria. That means this particular bulk response set does not prove optimized placement correctness. It does not mean moving jobs would be wrong; it means these responses did not expose moved jobs in the `jobs.optimized` chunk.

## Drive-time vs jobs nuance

Drive time can change without job start/end changing. Example `drive_buffer` cases add buffer to drive segments. That is a valid separate layer. But if a rule is supposed to move jobs, then at least one of job date/start/end/schedule should change OR route/feed/accept logs must explain why not. Current bulk captures mostly show drive/stats changes without job placement changes, so verdict is `REACHES_ENGINE` for drive-buffer only, not `PASS` for placement rules.

### Drive-time changed sample

| Scenario | Capture | Before sum | Optimized sum | Delta | Value-changed segments | Job placement changed? |
|---|---|---:|---:|---:|---:|---|
| `b000-control-future` | `260822-114057-b000-control-future` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b001-control-current` | `260822-114200-b001-control-current` | 1199.1 | 1172.3 | -26.8 | 0 | no |
| `b1000-sys-horizon-7` | `260822-114220-b1000-sys-horizon-7` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1001-sys-horizon-14` | `260822-114325-b1001-sys-horizon-14` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1002-sys-restrict-0` | `260822-114426-b1002-sys-restrict-0` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1003-sys-restrict-1` | `260822-114529-b1003-sys-restrict-1` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1004-sys-preserve-week` | `260822-114632-b1004-sys-preserve-week` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1005-sys-cross-tech` | `260822-114740-b1005-sys-cross-tech` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1006-wb-service-0830-1800` | `260822-114842-b1006-wb-service-0830-1800` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1007-wb-service-0900-1700` | `260822-114944-b1007-wb-service-0900-1700` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1008-wb-service-tight` | `260822-115045-b1008-wb-service-tight` | 3798.5 | 3876.4 | 77.9 | 2 | no |
| `b1011-wb-max-jobs-15` | `260822-115157-b1011-wb-max-jobs-15` | 3798.5 | 3876.4 | 77.9 | 2 | no |

### Route changed sample

| Scenario | Capture | Changed route chunks | Same route keys | Job placement changed? |
|---|---|---:|---|---|
| `b000-control-future` | `260822-114057-b000-control-future` | 6 | True | no |
| `b001-control-current` | `260822-114200-b001-control-current` | 1 | True | no |
| `b1000-sys-horizon-7` | `260822-114220-b1000-sys-horizon-7` | 6 | True | no |
| `b1001-sys-horizon-14` | `260822-114325-b1001-sys-horizon-14` | 6 | True | no |
| `b1002-sys-restrict-0` | `260822-114426-b1002-sys-restrict-0` | 6 | True | no |
| `b1003-sys-restrict-1` | `260822-114529-b1003-sys-restrict-1` | 6 | True | no |
| `b1004-sys-preserve-week` | `260822-114632-b1004-sys-preserve-week` | 6 | True | no |
| `b1005-sys-cross-tech` | `260822-114740-b1005-sys-cross-tech` | 6 | True | no |
| `b1006-wb-service-0830-1800` | `260822-114842-b1006-wb-service-0830-1800` | 6 | True | no |
| `b1007-wb-service-0900-1700` | `260822-114944-b1007-wb-service-0900-1700` | 6 | True | no |
| `b1008-wb-service-tight` | `260822-115045-b1008-wb-service-tight` | 6 | True | no |
| `b1011-wb-max-jobs-15` | `260822-115157-b1011-wb-max-jobs-15` | 6 | True | no |

## What is still not proven

- Whether jobs that should move to another day actually do so under exact CSV rules.
- Whether jobs added/removed from a specific day are correct, because the 450 run did not produce added/removed optimized job sets.
- Whether conflict priorities from `cross-module-combos.csv` are honored; those require corrected payloads and Custom Rules setup/cleanup.
- Whether modal Sandbox routes match after accept; preview-only responses do not provide enough explainability feeds.

## Next run required

Generate a corrected CSV-driven suite from the two data files, starting with 40–60 cases, using exact API field names/shapes, then validate each response with this raw layered comparator. Only after setup read-back is correct should we scale back to 1,455 corpus cases.
