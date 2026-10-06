# API Verification Playbook

How to prove an optimize response actually obeys the configured rules.

## Two run types — never mix their evidence

| | Sandbox | Route Optimizer modal |
|---|---|---|
| Who ran it | **Autopilot** (AI, scheduled) | **Manual**, user-triggered |
| Jobs endpoint | `routing/mantis/autopilot/jobs` (already-optimized state) | `routing/mantis/manual/optimize` (before + optimized in one stream) |
| Map | `routing/mantis/autopilot/routes` — needs `optimization_id` | `route` chunks inside the same stream |
| Feeds filter | `routing_type: autopilot` | `routing_type: manual` |

The sandbox shows the **result** of a run that already happened; the modal streams a
**preview** that is not applied until `manual/accept`. Always pass `routing_type` when
reading feeds, or the two runs contaminate each other's evidence.

`optimization_id` is the join key: the sandbox `completed` chunk and the optimize
`done`/`completed` chunk both carry it, and it links the placement data to the feeds rows.

## Endpoints

All paths are relative to `API_VERSION` (see `src/app/const/api/Mantis.js`).
Every call goes through `ApiUtils` and carries `token`, `platform`, `gd-branch-id`.

### Read/write the rule configuration

| Purpose | Method | Path | Service fn (`mantis/services/rulesService.js`) |
|---------|--------|------|-----------------------------------------------|
| Routing Rules (freeze/horizon/restrict) | GET · PUT | `routing/system-rules` | `fetchRoutingRules` · `saveRoutingRules` |
| Routing Triggers | GET · PUT | `routing/triggers` | `fetchRoutingTriggers` · `saveRoutingTriggers` |
| Workforce Boundaries | GET · PUT | `routing/workforce-boundaries` | `fetchWorkforceBoundaries` · `saveWorkforceBoundaries` |
| Route Efficiency | GET · PUT | `routing/route-efficiency` | `fetchRouteEfficiency` · `saveRouteEfficiency` |
| Service Commitments | GET · PUT | `routing/service-commitment` | `fetchServiceCommitments` · `saveServiceCommitments` |
| Custom Rules | GET/POST/PUT/DELETE | `routing/mantis/custom-rules[/:id]` | `fetchCustomRules` · `saveCustomRule` · `updateCustomRule` · `deleteCustomRule` |
| Verify a custom rule | POST | `routing/mantis/custom-rules/verify` | `verifyCustomRule` |
| Custom-rule conflict count | GET | `routing/mantis/custom-rules/count` | `fetchConflictCustomRulesCount` |
| Specific Rules | GET/POST/PUT/DELETE | `routing/mantis/specific-rules[/:id]` | `fetchSpecificRules` · … |

### Run an optimization

| Purpose | Method | Path | Service fn (`mantis/services/optimizerService.js`) |
|---------|--------|------|----------------------------------------------------|
| Optimize preview (NDJSON stream) | PUT | `routing/mantis/manual/optimize` | `streamOptimizePreview` |
| Accept the preview | PUT | `routing/mantis/manual/accept` | `fetchAcceptRoutes` |
| Sandbox jobs (NDJSON) | GET | `routing/mantis/autopilot/jobs` | `streamSandboxJobs` |
| Sandbox map routes (NDJSON) | GET | `routing/mantis/autopilot/routes` | `streamSandboxMap` |
| Widget stats | GET | `routing/mantis/widget` | `fetchRoutingWidgetStats` |
| Toggle autopilot | PUT | `routing/mantis/autopilot` | `toggleAutopilot` |

### Read what a run actually did — the explainability layer

This is where **why** lives. The optimize stream only says where a job landed; these say
which rule put it there, and which rule kept it out.

| Purpose | Method | Path | Service fn (`mantis/services/activityService.js`) |
|---------|--------|------|---------------------------------------------------|
| Jobs that could **not** be routed, each with `reasons[]` | GET | `routing/mantis/feeds/errors` | `fetchActivityErrors` |
| Count of the above | GET | `routing/mantis/feeds/errors/count` | `fetchActivityErrorsCount` |
| Run history — one row per optimization run | GET | `routing/mantis/feeds/history` | `fetchActivityHistory` |
| Run detail | GET | `routing/mantis/feeds/history/:id` | `fetchActivityDetail` |
| **Per-job move log** — `{ from: { start, user }, to: { start, user }, reasons: [] }` | GET | `routing/mantis/feeds/history/:id/logs` | `fetchJobLog` |
| Undo a run | PUT | `routing/mantis/feeds/history/:id/undo` | `undoActivityHistory` |

All feeds calls take `start`, `end`, `schedule_ids`, and **`routing_type: all | autopilot | manual`**
(`activity/constants.js` → `ACTIVITY_MODE_OPTIONS`).

`undoActivityHistory` is what makes a destructive test cycle repeatable — see
"Repeatable runs" below.

**Two id spaces — do not confuse them.** `:id` in the feeds paths is the **history row id**
(a small integer, e.g. `13`), *not* the stream's `optimization_id` (`opt_sandbox_…`).
Passing the latter returns a 404 HTML page. The stream id does not join to the feeds;
find the run by listing `feeds/history` and matching on `created_at` / `mode`.

**Preview does not write to the feeds** (verified 2026-08-22): three `manual/optimize`
calls produced no new history row and no errors row. Only an accepted run is recorded.
A preview must therefore be judged from the stream alone — `reasons[]` is unavailable
until the run is accepted.

Legacy (the pre-Mantis route optimizer screen, **not** these tests):
`routing/optimize`, `routing/accept`.

## Optimize request

`buildOptimizePreviewParams` (`optimizerService.js`):

```jsonc
{
  "schedule_ids": "12,34",       // CSV of technician schedule ids
  "start": "<ISO>",              // from the toolbar range
  "end":   "<ISO>",
  "statuses": "1,2" ,            // or -1 for all
  "inc": "recurring",            // "" when Include Recurring is off
  "color_id": 3,
  "drive_buffer": 10,            // minutes; omitted for "actual", 0 for "none"
  "jobs_per_day": 15,            // only when the dropdown is Custom
  "optimize_to": "<ISO end-of-day>",
  "exclude": [101, 102]          // job ids excluded from routing
}
```

The toolbar is **additive, not an override** (confirmed by product): the System/Custom
rules read from the four config endpoints apply in full on top of it.

- `schedule_ids`, `statuses`, `color_id`, `inc`, `exclude` — narrow the **job set** that
  enters optimization. A job filtered out here is absent, not violated.
- `jobs_per_day`, `drive_buffer`, `optimize_to` — these are **constraint values**, not
  filters. Treat the binding value as `min(toolbar, system rule)` — the tighter of the two.
  Assert against that minimum; if the response obeys only the looser value, report it as a
  contract mismatch rather than a rule violation.

Read the config before asserting, always.

## Optimize response — NDJSON chunks

Each line is one chunk: `{ type, scope, data, … }`.
`type` ∈ `OPTIMIZE_CHUNK_TYPE`, `scope` ∈ `OPTIMIZE_SCOPE`
(`src/app/modules/mantis/route-optimizer/services/optimize-route-stream.js`).

| `type` | `scope` | `data` |
|--------|---------|--------|
| `tracking` / `progress` | — | progress telemetry |
| `jobs` | `before` \| `optimized` | job events for that scope |
| `drive_time` | `before` \| `optimized` | drive-time segments between jobs |
| `downtime` | `before` \| `optimized` | idle gaps |
| `route` | `before` \| `optimized` | map polyline per schedule/day |
| `stats` | `daily` \| `total` | metrics; `total` is the headline before/after summary |
| `error` | — | aborts the stream |
| `done` / `completed` | — | carries `optimization_id` for the accept call |

The `optimization_id` from the terminal chunk is what `PUT routing/mantis/manual/accept`
consumes together with `schedule_ids` and `job_ids`.

### Verified payload shapes (captured 2026-08-22, branch GDZXO4NEQXGY)

```jsonc
// jobs chunk — NOTE .data, while the sandbox jobs stream uses .items
{ "type":"jobs", "scope":"optimized", "data":[ {
    "job":      { "id":"26620", "locked":0, "status":0, "name":"Monthly Service" },
    "event":    { "start":"2026-08-18T00:00:00+00:00", "end":"...", "length":15, "locked":0 },
    "schedule": { "id":"245", "name":"Schedule 2", "user_id":"84361372" },
    "location": { "lat":"25.4253", "lng":"-80.5062", "city":"…", "state":"FL" },
    "date_label":"08-18-2026"
} ] }

// drive_time / downtime segment — unit is self-describing
{ "start":"…", "end":"…", "job_id":"26621", "schedule_id":"245",
  "value":24.2, "unit":"minutes" }

// every stats metric carries its own type
{ "before":{"value":2986,"type":"minutes"}, "after":{…}, "saved":{…}, "percent":0 }
```

**Units never need to be asked for** — `type` / `unit` ship with every number
(`minutes` · `miles` · `gallons` · `jobs` · `dollars`). All instants are `+00:00`;
`event.length` is minutes.

`stats.total` keys: `time_ratio.{work_time,drive_time,downtime}`, `drive_time`,
`distance`, `fuel`, `jobs_assigned`, `delays`, `expected_payments`, `total_saved`.

### Cross-checks that caught real defects

Run these before any rule assertion — they are cheap and they fail loudly:

| Check | Why |
|---|---|
| `sum(optimized[].event.length) == stats.time_ratio.work_time.after` | work time is invariant under rescheduling; a mismatch means stats is not derived from the jobs |
| `sum(drive_time[scope].value) == stats.drive_time[scope]` | two independent sources for the same number in one response |
| placements identical ⇒ every `saved` must be 0 | a nonzero saving with an unchanged job set is fabricated |
| `jobs_assigned.after == count(optimized)` | catches phantom or dropped jobs |

A run that fails these cannot be used to judge any rule, because the evidence contradicts
itself before a rule is even considered.

## Verification procedure — three sources, not one

A single source cannot prove correctness. Placement data says *where*; the feeds say *why*.

| Source | Answers | Proves |
|--------|---------|--------|
| optimize stream / sandbox jobs | where each job landed | hard-rule invariants |
| `feeds/errors` (+ `routing_type`) | which jobs were dropped, and why | "expect unassigned" / "expect 0 jobs" |
| `feeds/history/:id/logs` | which jobs moved, from → to, and why | the right rule won a conflict |

Verifying placement alone is a false pass: a job absent from the optimized scope looks
identical whether the rule engine rejected it for the right reason, the wrong reason, or
lost it. Only `reasons[]` separates those.

### Steps

1. **Snapshot the config.** GET all four rule endpoints plus `routing/system-rules`.
   Record which fields have `status: 1`. A rule with `status: 0` must not be asserted.
2. **Compute the expected optimization range.**
   `start = today + freeze_window_days`, `end = start + optimization_horizon`.
   Do the arithmetic in **UTC** on the instants the backend returned (see "UTC discipline").
   Assert every returned job falls inside it, and that no job on a frozen day moved.
3. **Run the optimization** and capture every chunk (see "Repeatable runs").
4. **Split the enabled rules** into hard and soft using `rules-catalog.md`.
5. **Assert hard rules as invariants** over the `scope: "optimized"` jobs (table below).
6. **Assert soft rules as direction only** — compare `scope: "before"` against
   `scope: "optimized"` in the `stats/total` chunk. Never assert an exact value.
7. **Pull the feeds for this run**, filtered by the matching `routing_type`:
   - every job you expected to be unassigned must appear in `feeds/errors`, and its
     `reasons[]` must name the rule you expected to reject it. Present but with the wrong
     reason = **FAIL**, not a pass.
   - every job that changed slot or tech between `before` and `optimized` must have a row
     in `feeds/history/:id/logs` whose `from`/`to` match the stream, and whose `reasons[]`
     names the rule that moved it.
   - a job dropped from the stream with **no** row in either feed is a **FAIL** — silent loss.
8. **Resolve tensions** with `priority-hierarchy.md`, checking the winning rule against the
   `reasons[]` text rather than inferring it from placement.
9. **Diff against the corpus.** Match your scenario to a row in
   `data/module-rules-testcases.csv` or `data/cross-module-combos.csv` and quote its
   `expected` in the report. Apply the errata in `test-matrix.md` first.

## Resolving hard-vs-soft empirically

Several rules are ambiguous in the source sheets (Max Jobs per day most of all — the sheet
says Hard, product later said Soft). `reasons[]` settles these without waiting for product:

```
configure the rule so it MUST be exceeded to schedule everything, then run:

  job over the cap appears in feeds/errors, reason names the rule  →  HARD
  day exceeds the cap, feeds/errors empty for that job             →  SOFT
  job scheduled elsewhere, history log reason names the rule       →  HARD, with spillover
```

The same probe answers most of Q1–Q11 in `priority-hierarchy.md`. Q1 (`force_tech` vs Region
Strict), Q2 (`force_tech` vs Skill), Q3 (`force_tech` vs Day Exclusion), Q4, Q5, Q6 and Q7
all reduce to "which rule name appears in `reasons[]`". Only the questions about intended
*product design* — Q9 (empty route valid?) and Q11 (zero-length arrival window) — still need
a human answer.

Record an empirically-derived answer as **OBSERVED**, not as spec. It describes what the
build does today; it does not settle what the build should do.

## Repeatable runs

The verification has to survive being run many times, across sessions, by someone who was
not there for the last run. That needs three things.

### 1. Capture every run to disk

Write one directory per run under `captures/`:

```
captures/{YYMMDD-HHMM}-{scenario-slug}/
  config.json      the five rule-config GETs, exactly as returned
  request.json     the optimize/sandbox params actually sent
  optimize.ndjson  every chunk, raw, one JSON per line
  errors.json      feeds/errors for this run's routing_type + range
  logs.json        feeds/history/:id/logs for this run's optimization_id
  result.md        scenario id · rules enabled · expected · observed · verdict
```

Raw first, verdict second. A capture whose raw files were summarized away cannot be
re-judged when the assertions change — and the assertions will change.

### 2. Make the cycle non-destructive

A manual run only mutates data at `manual/accept`. Two safe modes:

- **preview-only** — run `manual/optimize`, never accept. Repeatable indefinitely. Verify
  placement from the stream; check whether feeds are populated at preview time (open
  question below) before relying on them here.
- **accept-then-undo** — accept, read the feeds, then `PUT feeds/history/:id/undo`. Use this
  when the reasons are only written on accept. Verify the undo restored the prior state
  before the next scenario, or every later run is polluted.

Autopilot runs are not user-triggered, so sandbox scenarios are bounded by the run schedule
(default daily 00:00). Do not design a sandbox scenario that assumes an on-demand run
until a trigger exists.

### 3. Pin the dataset

Same branch, same jobs, same technicians, same lat/long, every run. Record in `result.md`
the branch id and the job-id range the scenario touched. A capture that cannot name its
dataset proves nothing about a later one.

### Comparing runs

The point of capturing is the diff. Two runs of the same scenario against the same dataset
must produce the same placement; if they do not, the engine is non-deterministic and every
single-run verdict in the corpus is provisional. Test that first — same scenario twice,
back to back — before trusting any other result.

## Hard-rule assertions

Given `jobs` = every `jobs` chunk with `scope: "optimized"`, grouped by `(schedule_id, day)`:

| Rule | Assertion |
|------|-----------|
| Default Service Hours | `∀ job: job.start ≥ hours.start ∧ job.end ≤ hours.end` |
| Pre/Post-Shift Travel | `first.start ≥ hours.start + N` and `last.end ≤ hours.end − N` |
| Max Shift End Time | `∀ job: job.end ≤ max_shift_end_time` |
| Max Jobs per day | `count(jobs per schedule per day) ≤ max_jobs_per_day` (**soft** per product — report, don't fail) |
| Day Exclusions | `∀ job: ¬(job.schedule_id ∈ technician_ids ∧ weekday(job) = day_of_week)` |
| Max Travel Distance | `Σ drive_time[].distance per shift ≤ max_travel_distance_miles` |
| Max Shift Travel Time | `Σ drive_time[].duration per shift ≤ max_shift_travel_time_minutes` |
| Ignore statuses | jobs with those statuses keep their original slot **and** that slot may be reused |
| Route-around statuses | jobs with those statuses keep their slot **and** no other job occupies it |
| Skill Matching | `∀ job: job.service_type ∈ skills(assigned tech)` |
| Preferred Tech **Strict** | assigned tech == preferred tech, else the job is unassigned — **never** a substitute |
| Max Last Appt Departure | `∀ job: job.end ≤ max_departure_time` |
| Drive Buffer | `∀ segment: reported_drive == actual_drive + drive_buffer` |
| Region Enforcement **Strict** | `∀ job: region(tech) == region(job)` |
| `keep_period` | `isoWeek/month(new) == isoWeek/month(original)` |
| `movement_limit` | `abs(day(new) − day(original)) ≤ max_days` |
| `time_window` strict | `job.start ≥ window.from ∧ job.start ≤ window.to` |
| `first_stop` / `last_stop` | index 0 / last index within its day |
| `force_tech` | `job.schedule_id == tech_id` |
| `lock` | start, end, and tech all identical to before |
| `exclude` | the job id appears in **no** `optimized` chunk |

## Soft-rule checks — direction only

| Rule | Check |
|------|-------|
| Minimize Travel Time | `total.optimized.drive_time ≤ total.before.drive_time` |
| Minimize Travel Distance | `total.optimized.distance ≤ total.before.distance` |
| Workload Fairness | stddev of jobs/tech does not increase |
| Preferred Jobs per day | report the delta from the target; never a failure |
| Preferred Tech Soft / `prefer_tech` | preferred tech assigned **where available**; a fallback is valid |
| Customer Scheduling Preferences | preference honoured where feasible |
| `time_window` soft | inside the window where feasible |
| `arrival_window_duration` | affects the **displayed** window only — assert nothing about placement |

## Unresolved contract questions

Answer these before trusting a harness built on top of them; each one changes the design.

1. **Does `manual/optimize` write to the feeds at preview time, or only after `accept`?**
   If only on accept, every manual scenario costs an accept + undo cycle and the
   preview-only mode above cannot use `reasons[]` at all.
2. Can an autopilot run be triggered on demand? `toggleAutopilot` is on/off, not "run now".
   Without a trigger, sandbox scenarios are limited to the schedule.
3. Units and field names, still unpinned because the FE guesses them
   (`adaptRoutingWidgetStats` falls back across 6–8 keys per metric;
   `getJobScheduleId` reads `job.schedule.id || job.resourceId`):
   `drive_time[].duration` seconds or minutes · `distance` miles or km ·
   whether the reported drive time **already includes** `drive_buffer` ·
   the exact keys inside `stats.total`.
   A capture answers all of these faster than a spec request — read one before asking.

## Reporting

For each scenario report:
`scenario id (corpus row) · rules enabled · expected (from the corpus) · observed · verdict`.

| Verdict | Use when |
|---------|----------|
| **PASS** | every hard rule held, and the feeds named the expected rule |
| **FAIL** | a hard rule was violated, a priority resolution was wrong, the right outcome came with the wrong `reasons[]`, or a job vanished with no feed row |
| **OPEN QUESTION** | the spec does not settle it — Q9/Q11, and anything genuinely undefined |
| **OBSERVED** | resolved empirically from `reasons[]` (see hard-vs-soft above). Describes the current build, not the contract |

- Quote the actual response fragment as evidence — never summarize a metric you did not read.
- Cite the capture directory for every verdict, so it can be re-judged later.

## UTC discipline

Every Mantis calendar renders `timeZone: 'UTC'`. Parse backend instants with
`moment.utc(...)` — never bare `moment()`, never `String.slice(0, 10)`. An off-by-one
day here reads as a routing bug that does not exist.
