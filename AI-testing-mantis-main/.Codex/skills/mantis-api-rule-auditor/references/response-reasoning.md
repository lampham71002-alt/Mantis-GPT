# Reasoning from API responses

Use for every response audit. The checklist supplies intended settings; the response
supplies observations; the rule oracle supplies expected behavior. Do not replace one
with another. All Routing Rules formulas, setup gates, PASS/FAIL conditions and
interaction rules are embedded in `routing-rules-logic.md`. WB/RE/SC/custom semantics
are embedded in `mantis-rule-logic.md` and `custom-rules-dynamic.md`. These local files
are the complete working oracle; no external document or prior conversation is needed.

## Establish the run and setup

- Separate Sandbox, manual preview, and Auto-Pilot Live execution. A jobs endpoint
  named `autopilot` does not prove the scheduler fired. Manual selected dates bypass
  Auto-Pilot Freeze/Window, not enabled Restrict/Keep/Cross-Tech.
- Join by optimization ID and event ID; a recurring job ID can identify several
  occurrences. Record account/environment, capture time, request range, schedules,
  and the source of today's date/time interpretation when supplied. Do not mix runs.
- Keep requested checklist, saved GET/readback, and run-resolved config separate.
  Requested != readback is `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)`, not product
  FAIL. Missing readback means config persistence is unverified; checklist-based
  placement findings remain conditional and cannot become confirmed product bugs.
  Agreement with the same run's structured config can establish the rule value for
  a placement check, but cannot prove settings persistence or scheduler execution.
- Saved readback == requested, but that same run ignores it: `FAIL (config application)`
  only with matching account/run, config timing, and no legitimate mode/override.
  Do not assume an old checklist is a saved setting. A setup problem for one rule
  does not invalidate unrelated rules whose setup is independently established.
- Keep absent rules `NOT SUPPLIED`. List extra API-active rules as `OBSERVED` and
  request their intended values if needed; do not silently add them to the checklist.

## Build an evidence ledger for every supplied rule

Track: normalized value, semantic source, mode applicability, setup evidence, eligible
jobs/events, required raw fields, checked count, violations, missing evidence, verdict.
Include System, Custom, and supplied Specific rules. For Specific rules, preserve rule
ID and target event/job scope; interpret supplied text/actions with the custom-rule
procedure, but do not merge their identities or attribution categories. Without the
Specific rule definition, its scope and correctness are `UNVERIFIABLE`.

Evaluate all eligible records, not only the extractor's printed examples. `--limit`
limits display, not coverage. No eligible job is not proof that the rule works.
Report `UNVERIFIABLE (data gap: no eligible witness)` for behavior, while separately
reporting any verified config. Never call an unchecked rule PASS.

## Recompute before trusting explanations

| Constraint | Independent evidence / calculation |
|---|---|
| Freeze | In Sandbox/Auto-Pilot, frozen BEFORE date → compare date, time, technician; do not flag only a same-tech schedule change |
| Restrict | Absolute AFTER date − original/restored BEFORE date; exactly N allowed, N+1 fails |
| Keep Week/Month | `week_start = date - ((date.weekday() + 1) % 7 days)` for Sunday–Saturday weeks, or year+month pair; no ISO week numbers |
| Cross-Tech | Resolve BOTH schedule IDs to technician; unknown/ambiguous identity cannot prove PASS or FAIL |
| Max Jobs | Count distinct event occurrences across every schedule of the technician/day, including applicable fixed capacity; check completeness before PASS |
| Service hours / shift / departure | Recompute start/end against original rule values using `mantis-rule-logic.md`; do not let engine `operating_end` redefine a start-based cutoff |
| Travel / buffer | Recount inbound legs without double-counting `to_next`; missing return/null legs make totals lower bounds. Above an unambiguous cap can prove violation; below cannot prove full compliance |
| Preferred tech / skill / region / exclusions | Compare actual technician identity and raw preferences, skill IDs, region eligibility, exclusion rows. `matched=true` alone is insufficient |
| Custom / Specific | Evaluate each in-scope atomic assertion against placements, then reconcile attribution by rule ID |

An engine `move_window`, boolean signal, or rule explanation can itself be wrong.
When a flag says PASS but raw dates break Restrict, report the placement breach and
contradictory signal separately. Conversely, an engine-derived bound must map to a
confirmed rule before it can support a business FAIL.

Validate identity and data completeness before aggregation. Duplicate event records
must be investigated, not silently counted as extra jobs or silently discarded when
their placements differ. Partial schedules or pagination cannot prove a tech-day cap.

## Reason across rules

Compute the intersection of confirmed applicable hard constraints for each job.
Example: Restrict ±2 around Sat 19/09/2026 and Keep Week require a date in
17/09–19/09; a custom movement_limit(7) cannot extend it to Sun 20/09. Report both
individual constraints and the effective intersection.

Custom/Specific rules cannot loosen confirmed upstream System Routing Rules. A custom
force_tech to another technician with Cross-Tech OFF cannot justify reassignment.
The invalid assignment FAILs; conflict/unassigned presentation may remain open.
Keep documented sheet POTENTIAL conflicts in other modules open; do not use the
priority list to invent their resolution.

For each suspected violation, check applicability and alternatives: frozen/locked or
ignored status, pre-existing overload, manual mode, missing scope, missing identity,
and a documented precedence exception. Reject only the unsupported finding; continue
checking independent constraints. Do not hide a confirmed system breach behind a
custom-rule conflict, soft optimization benefit, or clean result in another phase.

Unassigned does not prove the expected rule rejected the job. Verify eligible scope,
remaining feasible slots and supplied errors/reasons. A missing job is not evidence
of rejection until filters, range, pagination and status exclusions are reconciled.

## Verdict and proof

- `FAIL`: confirmed applicable rule + valid setup + trustworthy contradictory result.
  One concrete violating event proves failure; include total checked and violated.
- `PASS`: required evidence is complete for the stated scope and all applicable hard
  checks passed. Routing Rules additionally carry `HARD_ONLY` or `SENSITIVITY_STRONG`.
- `UNVERIFIABLE`: name the exact missing field/readback/mapping/baseline or invalid
  setup and the smallest additional evidence needed. Missing evidence is not FAIL.
- `SCHEMA FAIL`: available fields contradict one another. Identify which dependent
  calculations are invalid; retain independent proven violations.
- `OPEN QUESTION`: expected semantics are unresolved. Show conditional calculations
  and observed result; do not write a product bug for the unresolved claim.

A bug must contain: run + event/job IDs, rule/value, oracle section or sheet row,
raw field paths/values, expected calculation, actual calculation, and why the rule
applies. Separate placement, config application, attribution, and schema findings.
Do not claim a solver root cause from a symptom or claim full-run PASS from a sample.

Finish with coverage (verified / violated / missing evidence / no witness) and the
minimum missing inputs. A single response often proves a violation; it usually cannot
prove sensitivity, settings persistence, Live isolation, or scheduled activation.
