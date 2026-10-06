# Dynamic custom rules

Custom rules are a **user-authored, dynamic array**. An account may have zero, one, or
many, written in natural language through the Mantis rule setter; nothing is
predefined. Sheet A `Custom Rules` only covers the 11 compiled primitives
(`keep_period`, `force_tech`, …). Every user rule is therefore interpreted into testable
assertions with this procedure, then mapped to a primitive when the meaning is the same.

## Accepted input

An optional `Custom rules:` block in the checklist message:

| Input | Meaning |
|---|---|
| Block omitted | `NOT SUPPLIED`: no CR expectation; never infer rules from Jira, API prose, or job notes |
| `Custom rules: none` or `Custom rules: []` | Explicitly zero rules; any custom attribution in the API (`rules.custom`, feed reasons) is a mismatch to report |
| One or more rules as written in Mantis | Each item = optional title line + `Rule:` text; items separated by numbering, bullets, or a blank line; optional `Status: active\|inactive` line (default: as shown in Mantis, else `active` and say so) |
| JSON array from `routing/mantis/custom-rules` | Use each item's fields exactly as returned (name, rule text, status, conditions/actions if present); never add missing fields |

`SETTINGS INPUT ERROR` for that rule only (other rules continue): leftover `<...>`
placeholder, unparseable JSON, an item without rule text, or two items with the same
title and different text.

## Interpretation procedure (per rule)

1. **Quote** the original title and rule text.
2. **Scope** — which jobs it targets (e.g. same customer location, a service type, jobs
   with a preferred technician). List the job fields needed (customer id, location or
   address id, service, tags, preferred tech, status …). Fields absent from the evidence
   → scope `UNVERIFIABLE`.
3. **Split** the text into atomic assertions: date, same-day grouping, technician, time
   window, route order/position, day movement, week/month period, lock, exclusion,
   notification window, or any other stated behavior.
4. **Map** each assertion to a sheet primitive when the meaning is identical (table
   below). A mapped assertion inherits the primitive's class, priority rank, sheet cases,
   and conflict notes.
5. **Classify unmapped assertions** from the wording:
   - Hard: must, always, never, only, all, "schedule X on/at/with …" without hedging.
   - Soft: prefer, try, if possible, when available, ideally.
   - Explicit non-constraint ("without forcing a specific technician"): record as
     not constrained; never FAIL on it.
6. **Ambiguity** — when a phrase allows more than one testable reading, list every
   reading and check each. All readings satisfied → PASS. Some satisfied → `OPEN
   QUESTION` with the satisfied reading as `OBSERVED`. None satisfied → FAIL.
7. **Precedence** — mapped assertions use the sheet rank. Unmapped assertions have no
   sheet rank. Confirmed upstream System Routing Rules still apply and cannot be
   loosened: breaking Freeze/Restrict/Keep/Cross-Tech is FAIL even if it satisfies the
   custom assertion. Unresolved conflict handling or other sheet POTENTIAL pairs stay
   `OPEN QUESTION`; check independent hard rules separately.
8. **Status** — inactive rules are interpreted and listed, never applied.
9. **Report first** an "Interpreted custom rules" table: rule, scope, assertion, class,
   mapped primitive or `custom`, fields needed, ambiguity. Verdicts come after it.

## Primitive map

| Meaning in the rule text | Primitive | Class | Parameter check |
|---|---|---|---|
| Stay within original week / month | `keep_period(week\|month)` | Hard | week or month |
| Must be assigned to technician X | `force_tech(X)` | Hard | exactly one technician |
| Prefer the job's preferred technician | `prefer_tech($stop.preferred)` | Soft | null preferred tech → rule does not apply |
| Move at most N days from original date | `movement_limit(N)` | Hard | integer N ≥ 0 |
| Must arrive between HH:MM and HH:MM | `time_window` strict | Hard | start < end; whole job must fit |
| Prefer arriving between HH:MM and HH:MM | `time_window` soft | Soft | start < end |
| Notify customer with an N-minute window | `arrival_window_duration(N×60 s)` | Display | seconds ≥ 0; ± half each side |
| First job of the day | `first_stop` | Hard | — |
| Last job of the day | `last_stop` | Hard | — |
| Do not move / keep placement | `lock` | Hard | route around it |
| Do not route / leave out of optimization | `exclude` | Hard | overrides everything |

For `keep_period(week)`, use the Sunday that opens the period as the week key:
`week_start = date - ((date.weekday() + 1) % 7 days)`. The valid period is Sunday
through Saturday; do not use ISO week numbers.

## Matching and conflicts

- Evaluate scope per job from stream fields; a missing field makes that job's match
  `UNVERIFIABLE`, not a miss. A job in no rule's scope gets system rules only.
- Several active rules in scope for one job → precedence between them is
  `OPEN QUESTION`; still verify each non-conflicting hard assertion.
- Mapped primitive conflicts follow the sheets: `first_stop` + `last_stop` (except a
  1-stop route), `lock` + `exclude`, two different `force_tech`, and
  `force_tech`/`first_stop`/`last_stop` + `exclude`. They are valid input with a conflict
  expectation (rule status `conflict` or the sheet winner), not input errors.
- Unmapped assertions that contradict each other (e.g. the same job group on two
  different days) → `OPEN QUESTION`; check whether the API marks rule status `conflict`.
- With a `routing/mantis/custom-rules` response: compare status (active / inactive /
  conflict) and any compiled conditions/actions with the interpretation. Disagreement is
  an interpretation mismatch: the user's text is intent, the API compilation is
  `OBSERVED`.
- Applied Rules `rules.custom` must list the rule for every in-scope job it affected;
  missing → explainability FAIL (see `applied-job-rules-api.md`).

## Worked example — same customer location grouping

```text
Custom rules:
All jobs at the same customer location will be scheduled together on the first date selected within the routing period.
Rule: Schedule all jobs for the same customer location on the same day within the selected period, keeping jobs together without forcing a specific technician.
```

| # | Assertion | Class | Mapping | Check |
|---|---|---|---|---|
| S | Scope: jobs in the optimization gate that share one customer service location | — | custom | Group by location id; fallback customer id + normalized address; neither present → `UNVERIFIABLE` |
| A1 | Every job of a location group is on the same date | Hard ("schedule all … on the same day") | custom | Distinct optimized dates per group = 1 |
| A2 | That date is the first date selected within the routing period | Hard | custom | See ambiguity R1/R2 |
| A3 | The date is inside the selected period | Hard | date gate | `optimization_start ≤ date ≤ optimization_end`, frozen dates excluded |
| A4 | Jobs are kept together | Hard, ambiguous | custom | See ambiguity T1/T2 |
| A5 | No specific technician is forced | Not a constraint | — | Same or different technicians both acceptable; technician choice follows system rules |

Ambiguities:

- **R1** first date = first date of the selected period (`optimization_start`).
  **R2** first date = earliest date in the period on which the whole group satisfies
  every system hard rule (frozen dates, day exclusions, service hours, Max Jobs, travel
  caps). Report which reading the placement satisfies.
- **T1** together = same day (identical to A1). **T2** together = consecutive stops on
  one technician's route with no other job between them.
- A group that cannot fit one technician-day (Max Jobs per Day, Service Hours, Max
  Shift Travel) — split across technicians, split across days, or unassigned — is not
  defined by the rule or the sheets → `OPEN QUESTION`, report `OBSERVED`.

Interactions to check:

- Restrict Job Movement `±N`, Keep Original Period, `movement_limit`, or `keep_period`
  may forbid moving a job to the group date → the confirmed system limit still holds.
  Violating it is FAIL; how the group is split/rejected is `OPEN QUESTION` when undefined.
- Ignore / route-around status jobs and `lock` jobs at the location stay in place, so
  the group may be incomplete; evaluate the rule on movable jobs and note the fixed ones.
- `exclude` removes a job from the group.

Verdict guide: A1 or A3 broken with no conflicting system hard rule → FAIL. A2 and A4
follow step 6 (both readings met → PASS; one → `OPEN QUESTION` + `OBSERVED`; none →
FAIL). A5 never fails. Missing location data → `UNVERIFIABLE`.

## Evidence in the jobs stream

Rule application and attribution are read from `feature_test_log`:
`summary.custom_rule_signal_counts` and each job's `constraints_applied`
(`locked`, `forced_rule_id`, `preferred_rule_id`, `position_rule_id`,
`hard_arrival_window`, `soft_arrival_window`, `move_window`, `conflict_rule_ids`,
`custom_rule_soft`). Checks for supplied, `none`, and omitted blocks are in
`feature-test-log.md` §Custom rules evidence.
