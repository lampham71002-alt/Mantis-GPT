# Mantis core 2-API bug analysis — final working report

Generated: 2026-08-24 08:32

## Scope

| Item | Value |
|---|---:|
| Current scenarios | 115 |
| Current API rows | 230 |
| `PUT /routing/mantis/manual/optimize` rows | 115 |
| `GET /routing/mantis/autopilot/jobs` rows | 115 |
| `GET /routing/mantis/autopilot/routes` rows | 0 — skipped; route polylines not rule-quality evidence |
| Full live sheet rows, including old matrix | 1277 |
| Old/setup failure rows kept separate | 159 |

Evidence files:

- CSV: `reports/api-payload-bug-sheet-live.csv`
- Markdown sheet: `reports/api-payload-bug-sheet-live.md`
- Current captures: `captures/260823-130444-smoke-no-routes-0-2/`, `captures/260823-130849-core-2api-rule-filter-no-routes-3-114/`

## Current 2-API severity counts

| API | Severity | Rows |
|---|---:|---:|
| `GET /routing/mantis/autopilot/jobs` | `CRITICAL` | 42 |
| `GET /routing/mantis/autopilot/jobs` | `HIGH` | 12 |
| `GET /routing/mantis/autopilot/jobs` | `MED` | 12 |
| `GET /routing/mantis/autopilot/jobs` | `OK` | 49 |
| `PUT /routing/mantis/manual/optimize` | `CRITICAL` | 41 |
| `PUT /routing/mantis/manual/optimize` | `HIGH` | 72 |
| `PUT /routing/mantis/manual/optimize` | `OK` | 2 |

## Bug buckets from current 2-API run

| Bucket | Rows |
|---|---:|
| Manual: optimized placement unchanged | 113 |
| Manual: fairness/preferred distribution poor | 48 |
| Autopilot jobs: fairness/preferred distribution poor | 48 |
| Autopilot jobs: jobs_per_day ignored | 44 |
| Manual: jobs_per_day ignored | 43 |
| Autopilot jobs: Max Jobs rule violated | 30 |
| Manual: Max Jobs rule violated | 29 |

## Main conclusions

1. **`manual/optimize` preview contract is still blocked.** In 113/115 current rows, `jobs.optimized` exists but no job changed schedule/start/end/day. One OK outlier moved only 1 job; one OK row had 0 jobs in scope.
2. **Max Jobs / `jobs_per_day` are not enforced.** Cases expecting 5 or 15 jobs/day still show 27–36 jobs/day depending on endpoint/scenario.
3. **`autopilot/jobs` shape parses, but rule/filter semantics fail in critical cases.** 49 rows are OK shape-only; 66 rows have CRITICAL/HIGH/MED semantic issues.
4. **Stats remain inconsistent.** Manual optimize rows show `work_time.after = 0` for future-week optimized jobs and `stats.drive_time` far above drive chunks in many rows.
5. **Old setup/config failures are separate from product bugs.** 159 old-matrix rows are validation/setup failures, not mixed into current 2-API feature bug counts.

## Concrete evidence examples

### manual/optimize placement unchanged

- Scenario: `r000-control-future-all-d000-control-future-csv`
- API: `PUT /routing/mantis/manual/optimize`
- Capture: `captures/260823-130444-smoke-no-routes-0-2/r000-control-future-all-d000-control-future-csv/`
- Severity: `HIGH`
- Payload: `{"color_id":1,"end":"2026-08-29T23:59:59+00:00","exclude":[],"inc":"recurring","schedule_ids":"245","start":"2026-08-23T00:00:00+00:00","statuses":-1}`
- Observed: `{"jobs_before":212,"jobs_optimized":212,"jobs_moved":0,"max_jobs_one_day":36,"drive_sum":[3798.5,3876.4],"drive_jobid_set_equal":false,"stats_work":[5370,0],"stats_drive":[28599,30371]}`
- Expected: control
- Bug: Optimized placement unchanged: jobs_optimized exists but no job changed schedule/start/end/day

### manual/optimize jobs_per_day=5 + Max Jobs 15 violation

- Scenario: `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15`
- API: `PUT /routing/mantis/manual/optimize`
- Capture: `captures/260823-130849-core-2api-rule-filter-no-routes-3-114/r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15/`
- Severity: `CRITICAL`
- Payload: `{"color_id":1,"end":"2026-08-29T23:59:59+00:00","exclude":[],"inc":"recurring","jobs_per_day":5,"schedule_ids":"245","start":"2026-08-23T00:00:00+00:00","statuses":-1}`
- Observed: `{"jobs_before":212,"jobs_optimized":212,"jobs_moved":0,"max_jobs_one_day":36,"drive_sum":[3798.5,3876.4],"drive_jobid_set_equal":false,"stats_work":[5370,0],"stats_drive":[28599,30371]}`
- Expected: Workforce Boundaries | 1 field | Max Jobs per day = 15 | Hard cap 15 jobs/day/tech, 16th job is not assigned
- Bug: Optimized placement unchanged: jobs_optimized exists but no job changed schedule/start/end/day; Payload jobs_per_day=5 ignored: max optimized jobs/day=36; Rule Max Jobs per day expected 15 but max optimized jobs/day=36

### autopilot/jobs jobs_per_day=5 + Max Jobs 15 violation

- Scenario: `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15`
- API: `GET /routing/mantis/autopilot/jobs`
- Capture: `captures/260823-130849-core-2api-rule-filter-no-routes-3-114/r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15/`
- Severity: `CRITICAL`
- Payload: `{"agenda":"agendaWeek","color_id":1,"end":"2026-08-29T23:59:59+00:00","exclude":[],"inc":"recurring","jobs_per_day":5,"schedule_ids":"245","start":"2026-08-23T00:00:00+00:00","statuses":-1}`
- Observed: `{"sandbox_jobs":212,"sandbox_max_jobs_one_day":36,"sandbox_optimization_id":"opt_sandbox_c6dbb37a09e91a7b1a4ce36f3acdb8d3"}`
- Expected: Workforce Boundaries | 1 field | Max Jobs per day = 15 | Hard cap 15 jobs/day/tech, 16th job is not assigned
- Bug: Sandbox jobs ignores payload jobs_per_day=5: max jobs/day=36; Sandbox jobs violates Max Jobs per day 15: max jobs/day=36

### fairness/preferred jobs poor distribution

- Scenario: `r007-jobs-per-day-tight-5-d004-workforce-boundaries-3-preferred-jobs-per-da`
- API: `GET /routing/mantis/autopilot/jobs`
- Capture: `captures/260823-130849-core-2api-rule-filter-no-routes-3-114/r007-jobs-per-day-tight-5-d004-workforce-boundaries-3-preferred-jobs-per-da/`
- Severity: `CRITICAL`
- Payload: `{"agenda":"agendaWeek","color_id":1,"end":"2026-08-29T23:59:59+00:00","exclude":[],"inc":"recurring","jobs_per_day":5,"schedule_ids":"245","start":"2026-08-23T00:00:00+00:00","statuses":-1}`
- Observed: `{"sandbox_jobs":212,"sandbox_max_jobs_one_day":27,"sandbox_optimization_id":"opt_sandbox_6bafa8cbff1f6e972c3aa6e9b2a644d6"}`
- Expected: Workforce Boundaries | 1 field | Preferred Jobs per day = 10 | Soft target 10 jobs/day, stop when free, increase when busy
- Bug: Sandbox jobs ignores payload jobs_per_day=5: max jobs/day=27; Sandbox jobs poor distribution for fairness/preferred jobs: max jobs/day=27

### manual OK outlier with one moved job

- Scenario: `r035-optimize-to-end-of-day-d177-service-commitments-7-max-last-appointment`
- API: `PUT /routing/mantis/manual/optimize`
- Capture: `captures/260823-130849-core-2api-rule-filter-no-routes-3-114/r035-optimize-to-end-of-day-d177-service-commitments-7-max-last-appointment/`
- Severity: `OK`
- Payload: `{"color_id":1,"end":"2026-08-29T23:59:59+00:00","exclude":[],"inc":"recurring","optimize_to":"2026-08-29T23:59:59+00:00","schedule_ids":"245","start":"2026-08-23T00:00:00+00:00","statuses":-1}`
- Observed: `{"jobs_before":212,"jobs_optimized":212,"jobs_moved":1,"max_jobs_one_day":36,"drive_sum":[3798.5,3896.1],"drive_jobid_set_equal":false,"stats_work":[5370,5385],"stats_drive":[28599,28599]}`
- Expected: Service Commitments | 2 fields | Max Last Appointment Departure Time (4:00 PM) + Region Enforcement (Strict) | Strict 4:00 PM cutoff — no jobs will end after 4:00 PM | Region strict — jobs outside the region are blocked, not assigned

## Recommended BE tickets

| Priority | Ticket | Evidence |
|---|---|---|
| P0 | `manual/optimize` returns optimized jobs that echo `before` / placement not exposed | 113/115 current manual rows unchanged; drive chunks can change while jobs do not |
| P0 | Max Jobs / `jobs_per_day` not enforced in manual optimize and sandbox jobs | critical cases still max 27–36 jobs/day |
| P1 | Stats total/daily values inconsistent with raw chunks | `work_time.after=0` while optimized jobs exist; `stats.drive_time` differs from drive chunks |
| P1 | Fairness/preferred jobs distribution insufficient | fairness scenarios still max 27–36 jobs/day |
| P2 | Clarify whether `autopilot/jobs` is intended as route-quality output or display feed only | It parses, has `optimization_id`, but no before/after placement basis |

## Unresolved questions

1. Should `jobs[scope=optimized]` contain final optimized placements, or should FE reconstruct placement from route/drive chunks?
2. Are System Rules expected to affect `manual/optimize` preview today?
3. Should `autopilot/jobs` enforce toolbar `jobs_per_day` and Max Jobs rules, or only show current sandbox event rows?