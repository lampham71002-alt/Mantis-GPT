# Routing Rules logic (Sheet C)

Embedded decision rules for the seven Routing Rules (gate) fields. This file contains
the operational logic, formulas, setup gates, evidence requirements, and PASS/FAIL
conditions converted from the V1 QA standard. Use these rules directly, offline.
No Drive access or original author's session is required.

The matching 49 Routing Rules cases and 28 cross-module cases are bundled in
`cases/sheet-c-*.csv` (search with `--tab sheet-c`). Recorded execution status is
`Not Run`; case availability does not prove execution.

Scope: Auto-Pilot Run Frequency, Freeze Window, Optimization Window, Restrict Job
Movement, Keep Original Period (Week / Month), Route Across All Tech Schedules. Other
modules appear only as interactions (§Cross-module).

## Precedence

- For these seven fields Sheet C decides expected outcomes and supersedes the Jira date
  gate wording (`des-9619-decisions.md` §Jira vs sheets).
- Where Sheet C contradicts Sheet A/B or a documented override in `mantis-rule-logic.md`,
  report `OPEN QUESTION` (`sheet-case-catalog.md` §Contradictions); never pick a side.

## Setup gate (before any verdict)

Confirm from the evidence: the requested date range, Schedule → Technician mapping, job
status / lock / freeze state, the BEFORE baseline, and — when the case must prove
sensitivity — a real routing opportunity. A wrong setup (wrong range or baseline, a
frozen/locked/ignored witness, no routing opportunity) is `UNVERIFIABLE (setup)` or
`UNVERIFIABLE (data gap)`, not a product FAIL.

Requested != GET/readback is a setup mismatch, not a product FAIL.
Follow `response-reasoning.md` for config provenance: only a confirmed
saved setting ignored by the same run, with no legitimate override, can prove a config
application defect. A checklist alone is not proof of a successful settings save.

HTTP 200, `success=true`, or a saved config proves only the technical request; business
PASS needs route evidence. Never require the exact solver route: several valid solutions
may exist, so judge the hard invariants only (`Routing Rules` #45).

## Evidence strength

- **Hard compliance** — the observed result breaks no rule. Keep Week ON, BEFORE 18/09,
  AFTER 14/09, both in Sun 13/09–Sat 19/09 → PASS. It does not prove the rule changed
  behavior.
- **Sensitivity proof** — Phase A (OFF / wider) finds a discriminating witness → restore
  the exact baseline → Phase B (ON / tighter) on the same Job ID blocks or narrows the
  prior behavior.

Every Routing Rules PASS carries `evidence_strength`: `SENSITIVITY_STRONG` (a comparative
witness proves the effect) or `HARD_ONLY` (no witness; also written
`NO_SENSITIVITY_PROOF`). When the case goal is sensitivity and no witness exists →
`UNVERIFIABLE (data gap)`.

Comparative guardrails (`Routing Rules` #24–#29, #42–#48):

- Restore between phases: same Job ID, date, time, schedule, technician, status, lock
  state, and surrounding jobs/capacity. Phase A AFTER never becomes Phase B BEFORE.
- `phase_output_diff=true` alone is not sensitivity proof.
- A frozen, locked, or otherwise immovable job is never a witness for another rule.
- A hard violation in any valid phase is FAIL; sensitivity in another phase never masks
  it (Phase A Restrict 7 with an 8-day move is FAIL even when Phase B Restrict 3 is clean).
- Contaminated attribution → `UNVERIFIABLE (review)`; never invent a FAIL cause.

## Rule oracle

### Auto-Pilot Run Frequency

- Config: saved frequency/time equals the GET readback. Proves configuration only.
- Runtime needs: configured_at, scheduled_fire_at, Live BEFORE, Sandbox BEFORE/AFTER,
  poll/runtime evidence, FINAL Live.
- PASS: scheduler activation and a Live change attributable to Auto-Pilot are observed,
  and FINAL Live satisfies every confirmed hard rule. FINAL
  Live ≠ Sandbox AFTER is diagnostic only (#40).
- FAIL `no Auto-Pilot activation`: ON, fire time reached, routing opportunity proven, and
  no Live activation within a reasonable timeout. FAIL `Auto-Pilot routing invalid`:
  activation happened but the final route breaks a hard rule.
- Sandbox BEFORE == Sandbox AFTER → `UNVERIFIABLE (data gap: no routing opportunity)`;
  a timer fire or HTTP success alone is never PASS (#39).

### Freeze Window

- Today = Day 1. Freeze N calendar days (weekends count) → frozen Today … Today+N−1;
  first open day = Today+N. `Until end of work day` = today frozen.
  *Ex:* Fri 11/09, N = 2 → 11/09 and 12/09 frozen; Sun 13/09 is the first open day.
- A frozen job keeps date, time, and technician; any change is FAIL.
- An open job that does not move is not FAIL: eligibility does not require movement.
- Strong Freeze sensitivity: wider Freeze protects an otherwise movable job → restore
  exact baseline → narrower Freeze releases the same job and it actually moves.

### Optimization Window

- Loading / optimization scope: horizon `[today, today + M − 1]` inclusive, with the
  frozen days inside it (#30 "frozen overlap"); open part `optimization_start = today +
  freeze` … `optimization_end = today + M − 1`. Jira's worked example (Today 13/08,
  Freeze 1, 7 days → 14/08–19/08) and the jobs stream (`windows.horizon_start_unix` =
  today) agree; Jira's written formula `start + horizon − 1` contradicts its own
  example, so never use it. Jobs on both boundary days are in scope (#13, #14).
- Not a final destination boundary: a loaded job may land outside the window. Never FAIL
  only for that; PASS when Freeze, Restrict, Keep Period, and every other hard rule hold
  (#16).
- A job whose BEFORE is outside the loaded range is not "optimized" unless the response
  shows it was loaded or considered (#15).
- Do not invent a nearest overflow date, maximum overflow, slot tie-break, or preferred
  overflow destination.
- Window sensitivity (e.g. 7 → 14 days) is strong only when the wider horizon actually
  loads a new eligible witness or creates an observed routing opportunity.
- Freeze protects the overlap; the window never overrides Freeze (#30).

### Restrict Job Movement

- `move_days = |AFTER.date − BASELINE.date|` in calendar days; PASS iff `move_days ≤ N`
  for every movable job. Exactly N is valid; N+1 is FAIL (#17, #18).
- BASELINE = the original or restored date of the phase being verified.
- N = 0 → date unchanged; the time may still change unless another rule constrains it.

### Keep Original Period — Week

- Week = **Sunday → Saturday**. Never use the ISO Monday–Sunday week or ISO week numbers.
- Compute the period key as `week_start = date - ((date.weekday() + 1) % 7 days)`;
  `weekday()` is Monday=0 through Sunday=6, and the resulting key is the Sunday date.
- AFTER must be in the same Sunday–Saturday week as BASELINE. Sun 13/09 → Sat 19/09 is
  PASS; Sat 19/09 → Sun 20/09 is FAIL (#19, #20).

### Keep Original Period — Month

- AFTER must be in the same calendar month and year as BASELINE. 30/09 → 01/10 and
  31/12 → 01/01 are FAIL (#21, #22).

Compare dates in the account's local calendar. The jobs stream has no timezone field;
its `+00:00` timestamps line up with the local operating window (placements start at
the 07:15 operating start in the 2026-09 captures), so use the date part as written and
say so. If other evidence shows the offset is real UTC and a move sits near midnight,
mark that boundary check `UNVERIFIABLE`.

### Route Across All Tech Schedules

- Resolve Schedule ID → technician identity before any verdict.
- OFF: the technician must not change. A schedule change between two schedules of the
  same technician is PASS (#23); a different technician is FAIL.
- ON: a technician change is allowed, never required. Same technician AFTER is PASS; an
  actual change is stronger sensitivity evidence.
- No mapping → `UNVERIFIABLE (need schedule → technician mapping)`; never infer a
  technician change from schedule IDs (#46).

### Interactions inside Routing Rules

- Freeze + Window: only the open part of the window is optimized.
- Freeze + Restrict / Keep: frozen jobs stay; movable jobs obey Restrict / Keep; frozen
  jobs are not witnesses.
- Window + Restrict / Keep Period: overflow is allowed only inside Restrict ±K and the
  original week/month.
- Restrict + Keep Period: the final date lies in the intersection; any date there is
  acceptable (no preferred date).
- Cross-Tech + date rules: both apply; neither drops the other.
- Dense integration (#49): every job satisfies all active hard constraints at once.

## Cross-module (`RR Cross-Module`)

Routing Rules are upstream system constraints that intersect every other hard rule.
System, Custom, and Specific rules never loosen a system rule. `OPEN QUESTION` rows are
not written as bugs until product behavior is confirmed.

| Interaction | Rows | Expected |
|---|---|---|
| Freeze + Service Hours / Day Exclusions | #1, #2 | Frozen jobs unchanged; WB checked on movable jobs; frozen job is not a witness |
| Restrict + Day Exclusions / Max Jobs | #3, #4 | Intersection |
| Keep Week / Month + Service Hours / Max Shift End / Drive Buffer | #5, #6, #15 | Intersection |
| Cross-Tech OFF + Day Exclusions | #7 | Technician unchanged; move the date within other rules or leave unassigned; reassigning is FAIL |
| Cross-Tech OFF + Skill Matching | #9 | Technician unchanged; never an invalid assignment |
| Cross-Tech ON + Day Exclusions / Skill / Region Strict | #8, #10, #16 | Technician may change only to a valid technician |
| Cross-Tech OFF + Preferred Soft | #11 | Soft preference never forces a technician change |
| Cross-Tech OFF + Preferred Strict | #12 | Technician change is FAIL; unassigned vs conflict presentation is `OPEN QUESTION` |
| Window overflow + Max Last Departure | #13 | Overflow allowed; the start must still meet the cutoff |
| Restrict + Max Last Departure | #14 | Intersection; `start == cutoff` is `OPEN QUESTION` (catalog §Contradictions) |
| Restrict / Keep + CR `movement_limit` / `keep_period` | #17–#20 | Intersection (tighter limit) |
| Window + CR `movement_limit` / `keep_period` | #21, #22 | Overflow allowed only inside the CR limit |
| Freeze + CR `lock` | #23 | Redundant; job unchanged |
| Cross-Tech OFF + `force_tech` (other technician) | #24 | Technician change is FAIL; conflict presentation is `OPEN QUESTION` |
| Cross-Tech ON + `force_tech` (valid technician) | #25 | Forced technician allowed when every other hard rule allows it |
| Multi-module combos | #26–#28 | Every active hard constraint holds; Auto-Pilot activation never bypasses downstream rules |

## Manual Route Optimizer

Manually selected dates are not defined by Auto-Pilot Freeze / Optimization Window;
Restrict, Keep Original Period, and Cross-Tech still apply when enabled (#41). Missing
manual-flow evidence → `UNVERIFIABLE (need probe)`.

## Sheet C labels → skill verdicts

| Sheet C label | Skill verdict |
|---|---|
| Passed | `PASS` + `evidence_strength` |
| Failed, `FAIL_NO_AUTOPILOT_ACTIVATION`, `FAIL_AUTOPILOT_ROUTING_INVALID` | `FAIL` |
| Data Gap, `INVALID_TEST_DATA` | `UNVERIFIABLE (data gap)` |
| Need Probe | `UNVERIFIABLE (need probe)` |
| `SETUP_ERROR`, `REVIEW_SETUP_MISMATCH` | `UNVERIFIABLE (setup)`; no product bug without independent evidence of config application failure |
| Review, SHADOW | `UNVERIFIABLE (review)` |
| Open Question, `NEED_CONFIRM` | `OPEN QUESTION` |
| Not Run | No recorded result |

## Minimum evidence per case

Case ID, config requested, GET/readback, Job ID, BEFORE and AFTER date / time /
schedule / technician, the rule-specific calculation, expected, actual, verdict, reason.
Comparative cases add Phase A config and witness, proof of exact baseline restore,
Phase B config, same-witness result, hard compliance, and evidence strength. Auto-Pilot
runtime cases add the runtime fields listed under §Auto-Pilot Run Frequency.

## Source metadata (optional refresh only)

Logic version: V1, 2026-09-14. Converted from
`MANTIS_ROUTING_RULES_LOGIC_EXPECTED_PASS_FAIL_V1.md`, Drive ID
`19FxY3sdsM8iWKT-7X4aut61-ZFuda3DA`. Case workbook:
`MANTIS_ROUTING_RULES_TESTCASES_FOR_DES9169_DES9619_V1.xlsx`, Drive ID
`1UV7tzlqwkAS3pNVWTvFJGhkosMhw1E3T`. These identifiers are for an explicitly requested
source refresh; they are not dependencies of an audit. Existing local sheet conflicts
must be reviewed before verdicts, as specified under Precedence above.
