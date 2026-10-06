# Sheet case catalog

Case-level index of the three rule workbooks. Use it to find the matching sheet row,
apply errata, and classify unresolved outcomes. Semantics live in
`mantis-rule-logic.md` and, for Routing Rules, `routing-rules-logic.md`. Snapshot read
2026-09-14; re-read the sheets only when the user asks for a refresh.

## Case snapshots (every row)

Full-row CSV copies live in `references/cases/`; this catalog only summarizes them.
Search with `python3 scripts/find-sheet-case.py <term> [<term> ...] [--tab <name>]`.

| File | Cases | Columns |
|---|---|---|
| `sheet-a-summary.csv` | 5 modules | #, Module, fields/actions, TC number, source file |
| `sheet-a-workforce-boundaries.csv` | 134 + logic-fix/edge rows | #, Group, Condition, Input, Object, Expected, Status, Bug notes, Status Run Routing, Bug IDs |
| `sheet-a-route-efficiency.csv` | 263 + errata/edge rows | #, Group, Condition, Input, Object, Expected, Status, Bug notes |
| `sheet-a-service-commitments.csv` | 60 | #, Group, Condition, Input, Object, Expected, Status, Bug notes |
| `sheet-a-custom-rules.csv` | 272 + tier summary | #, Group, Conditions, Input, Object, Expected, Conflict |
| `sheet-a-cross-module.csv` | 44 + count summary | #, Group, Combined conditions, Modules, Expected, Conflict |
| `sheet-a-module-references.csv` | 31 fields | Module, #, Field/Action, Type, Control, Logic note |
| `sheet-a-priority-hierarchy.csv` | 27 ranks | #, Rule, Note |
| `sheet-b-cross-module-combos.csv` | 663 + summary | #, Group, WB, RE, SC, CR, Expected, Conflict |
| `sheet-c-readme.csv` | legend | Item/Value, verdict legend, how-to-use guardrails |
| `sheet-c-routing-rules.csv` | 49 | #, Group, Condition, Input, Object, Expected, Status, NOTE Bug Reports |
| `sheet-c-rr-cross-module.csv` | 28 | #, Group, RR, WB, RE, SC, CR, Expected, Conflict |

Row matching: Sheet A module tabs and Sheet C `Routing Rules` join field names with
` + ` in Condition; Sheet B and Sheet C `RR Cross-Module` put one value per module
column. Sheet C rows use placeholders (`N`, `M`, `K`): match the rule combination and
substitute the checklist values. An exact case match needs every active rule and value
in the row; otherwise report the closest row and say it is not exact.

The Custom Rules tab and CR columns cover only the 11 compiled primitives. A dynamic
user rule has a sheet row only for the parts mapped to a primitive
(`custom-rules-dynamic.md`); unmapped assertions have no sheet row — say so.

## Coverage map

| Workbook / tab | Cases | Structure | Status column |
|---|---|---|---|
| A `Summary` | 773 total | WB 134, RE 263, SC 60, CR 272, Cross-Module 44 | — |
| A `Workforce Boundaries` | 134 | 1–N field combos of 7 fields + edge + logic-fix rows | Status, Bug IDs, Status Run Routing |
| A `Route Efficiency` | 263 | 1–8 field combos of 8 fields + edge + errata rows | Status, Bug IDs |
| A `Service Commitments` | 60 | 1–5 fields (Strict), 1–5 fields (Soft region), 13 edge | Status, Bug IDs |
| A `Custom Rules` | 272 | Tier 1–3 full (231), greedy quad 4–9 actions (18), edge 23; quad coverage 100% | none |
| A `Cross-Module` | 44 | 1/2/3/4 modules ON (4/12/8/4) + 16 cross-module edges | none |
| A `Module references` | 31 fields | Module, field, class, control, logic note | — |
| A `Priority hierarchy` | 27 ranks | Rule + note | — |
| B `Cross-Module Combos` | 663 | 4-key full cross 256; non-key × key 68; non-key pairs 101; non-key full cross 210; edge 28 | none |
| C `README` | — | V1 2026-09-14 draft, verdict legend, 7 usage guardrails | — |
| C `Routing Rules` | 49 | 1 field 10; Boundary 13; Comparative 6; 2 fields 9; Runtime 2; Mode 1; Evidence Guardrail 5; Advanced 3 | Status (all Not Run) |
| C `RR Cross-Module` | 28 | RR×WB 8; RR×RE 4; RR×SC 4; RR×CR 9; RR×Multi 3 | none |

Sheet B key values per module: WB {Service Hours 8:30–6PM, Max Jobs 15, Max Shift End
6PM, Workload Fairness}; RE {Max Travel Distance 10mi, Skill Matching, Preferred Tech
Strict, Max Shift Travel 120min}; SC {Max Last Appt 4PM, Region Strict, Drive Buffer
10min, Customer Pref}; CR {keep_period week, force_tech chris, time_window strict 8–14,
lock}. Non-key values: Preferred Jobs 10, Pre/Post 30min, Day Exclusions (Tech A off
Mon), Min Travel Time 5min, Min Travel Distance 0.5mi, Ignore/Route-around status,
Preferred Tech Soft, Arrival Window Override 2h, Region Soft, prefer_tech,
movement_limit 3, time_window soft 8–12, arrival_window_duration 3600s, first_stop,
last_stop, exclude.

Standard Sheet B conflict notes (apply automatically when the combo contains them):

- contains `exclude` → "CONFLICT — exclude overrides all; job does not enter route".
- contains `lock` → "LOCK — job locked; WB/RE/SC still apply to other jobs".
- `force_tech` + Preferred Tech Strict → force wins, preferred ignored.
- `force_tech` + Region Strict → POTENTIAL (open).
- `force_tech` + Skill Matching → POTENTIAL (open).
- Max Last Appt 4PM + Max Shift End 6PM → earlier cutoff (4PM) wins.
- strict `time_window` [8–14] + Service Hours 8:30–6PM → window narrower; job only 8–14.
- Drive Buffer + Max Shift End → buffer can push job past Max Shift End (check).
- SC Arrival Override + CR `arrival_window_duration` → CR applies on top of SC.
- Preferred Tech Soft + `prefer_tech` → REDUNDANT.

## Module edge cases

### Routing Rules (Sheet C)

Full oracle and cross-module table: `routing-rules-logic.md`.

| Case | Expected |
|---|---|
| Freeze 2, today Fri 11/09 | 11/09 and 12/09 frozen; Sun 13/09 first open day (weekends count) |
| Frozen job | Date, time, and technician unchanged |
| Job on optimization_start / optimization_end | In loading scope (inclusive) |
| Job whose BEFORE is outside the loaded range | Not treated as optimized unless evidence shows it was loaded |
| Loaded job placed after the window | Not FAIL by itself; Freeze, Restrict, Keep still apply |
| Restrict 0 | Date unchanged; time may change |
| Restrict: move exactly N / N+1 days | PASS / FAIL |
| Keep Week Sun 13/09 → Sat 19/09 | PASS (`HARD_ONLY` without an OFF witness) |
| Keep Week Sat 19/09 → Sun 20/09 | FAIL |
| Keep Month 30/09 → 01/10; 31/12 → 01/01 | FAIL |
| Cross-Tech OFF, schedule A → B of the same technician | PASS |
| Cross-Tech ON, technician unchanged | PASS |
| Schedule → technician mapping missing | UNVERIFIABLE |
| Auto-Pilot run with Sandbox BEFORE == AFTER | UNVERIFIABLE (data gap) |
| FINAL Live ≠ Sandbox AFTER, every hard rule valid | PASS |
| Manual Route Optimizer selected dates | Freeze/Window do not apply; Restrict/Keep/Cross-Tech do |
| Phase A breaks Restrict, Phase B clean | FAIL (sensitivity never masks a violation) |
| No OFF / wider witness | PASS `HARD_ONLY`, never `SENSITIVITY_STRONG` |

### Workforce Boundaries

| Case | Expected |
|---|---|
| Service Hours end = Max Shift End, job ends exactly 6:00 PM | Allowed |
| Job longer than remaining effective window | Blocked |
| Max Jobs 0 | 0 jobs/day for tech |
| Preferred Jobs 0 | No soft target; schedule up to Max Jobs |
| Preferred Jobs = Max Jobs (10/10) | Exactly 10/day if enough jobs |
| All fields OFF | System default; nothing overridden |
| Day Exclusions all 7 days, all techs | 0 jobs |
| Day Exclusions Monday, all techs | No tech on Monday; jobs move or blocked |
| Workload Fairness ON, one active tech | All jobs to that tech |
| Max Shift End < Service Hours start (7AM vs 8AM) | 0 jobs |
| Service Hours start = end | 0 jobs |

### Route Efficiency

| Case | Expected |
|---|---|
| Min Travel Time vs Min Travel Distance disagree | OPEN QUESTION (priority time vs distance) |
| Max Travel Distance 0 / Max Shift Travel 0 | 0 jobs |
| Ignore ON + Route around ON (different statuses) | Ignore jobs skipped; route-around jobs block slots; no loop |
| Same status in Ignore and Route around | OPEN QUESTION |
| Ignore ON / Route around ON with empty status list | Nothing skipped |
| Skill ON + Preferred Soft tech lacks skill | Skill wins; assign capable tech |
| Skill ON + no tech has skill | OPEN QUESTION (unassigned or fallback) |
| Preferred Strict + preferred tech off/terminated/excluded | Unassigned; no other tech |
| All optimization OFF | Default routing |
| Job > Max Travel Distance from all techs | Unassigned |
| Min Travel Distance 15mi > Max 10mi | Target unreachable; stay ≤ 10mi |
| Min Travel Time 150min > Max Shift Travel 120min | Target unreachable; stay ≤ 120min |

### Service Commitments

| Case | Expected |
|---|---|
| Max Last Appt = Shift End | No assignment after cutoff; ending exactly at cutoff OK |
| Arrival Override 0h | Point-in-time, no window (verify UI/logic) |
| Region Soft, job outside region | Assigned, ranked behind in-region jobs |
| Drive Buffer 0 | Drive unchanged |
| Buffer 10min pushes job past Max Last Appt 4PM | Job rejected |
| Region Strict + customer pref in other region | Strict region wins |
| Customer Pref + Arrival Override 2h spanning two slots | Customer window first, override after |
| All 5 settings OFF | Default behavior |
| Max Last Appt 4PM + 2h job ranked at 3PM | Rejected or postponed to another date |
| Arrival Override 12h > service hours 10h | Window clamped to service hours |
| Drive Buffer 120min | Many jobs rejected at cutoff |
| Customer Pref ON, customer has no preference | Default routing |
| Max Last Appt 6AM before Service Hours 8AM | 0 jobs |

### Custom Rules

| Case | Expected |
|---|---|
| lock + exclude, one stop | Rule status = conflict; user resolves (Sheet B #658: exclude wins) |
| first_stop + last_stop same stop | Conflict, except 1-stop route |
| force_tech chris + force_tech alex same filter | Conflict |
| keep_period week + month same stop | No conflict; intersection |
| match: all, stop matches 2/3 filters | Rule not applied |
| match: any, stop matches 1/3 filters | Rule applied |
| preferred_tech: * with null preferred_tech_id | Rule not applied |
| time_window strict [8–12] + 4h job | Unassigned if not enough time |
| Inactive rule | Ignored |
| Stop matches no custom rule | System rules only |
| movement_limit(0) + keep_period(week) | Original date |
| time_window strict + movement_limit(0) | Both hard |
| force_tech + tech has Day Exclusion | OPEN QUESTION |
| exclude, only stop in route | OPEN QUESTION (empty route?) |
| arrival_window_duration 0 | Point-in-time (verify) |
| Multiple custom rules match stop | OPEN QUESTION (first match / all apply?) |
| Large movement_limit + keep_period(month) | keep_period blocks crossing month |
| time_window strict 6–7AM vs service 8AM–6PM | 0 jobs |
| prefer_tech + tech terminated/inactive | OPEN QUESTION (fallback or unassigned) |
| force_tech + tech lacks skill | OPEN QUESTION |
| All hard (keep_period, force_tech, movement_limit, strict window, first_stop, lock) | All apply together |
| All soft (prefer_tech, soft window, arrival_window_duration) | Best effort only |
| force_tech + prefer_tech | REDUNDANT; prefer no effect |

### Cross-module edges (Sheet A #29–#44, Sheet B #636–#663)

| Case | Expected |
|---|---|
| Service Hours vs strict time_window [8–14] | Job only 8–14 |
| Max Shift End 6PM vs Max Last Appt 4PM | 4PM wins |
| Max Jobs 15 + one exclude | 14 routable |
| force_tech chris vs Preferred Strict alex | chris assigned |
| force_tech vs Region Strict (chris out of region) | OPEN QUESTION |
| force_tech vs Skill Matching (chris lacks skill) | OPEN QUESTION |
| force_tech vs Day Exclusion (chris = Tech A off Mon) | OPEN QUESTION |
| Preferred Soft alex + Region Strict + force_tech chris | OPEN QUESTION (region vs force) |
| Preferred Strict + Skill + Region Strict + force_tech chris | OPEN QUESTION |
| lock vs Max Travel Distance | Lock stays; cap applies to other jobs |
| exclude vs all modules ON | Job out of route; constraints irrelevant for it |
| movement_limit(0) vs keep_period(week) | Same hard effect |
| Arrival Override 2h + arrival_window_duration 3600s | CR on top of SC |
| Workload Fairness vs force_tech | Force wins for that job; fairness for the rest |
| Preferred Soft vs Customer Pref vs prefer_tech | OPEN QUESTION (soft order) |
| 8 hard constraints together | All apply; max restriction |
| All soft constraints together | Best effort balance |
| All OFF | Default routing |
| Service Hours 8:30–9AM + Pre/Post 30min | 0 jobs |
| Max Last Appt 4PM + Drive Buffer 30min | Buffer exceeds cutoff → rejected |
| Max Shift Travel 60 + Drive Buffer 30 | Effective travel 30 |
| keep_period(month) + movement_limit(45) | keep_period wins |
| Day Excl Tech A + Preferred Strict A + Skill + force_tech B | Force B; assign B if B has skill; A's exclusion irrelevant |
| Max Travel 10mi + Max Shift Travel 120 + Region Strict + Buffer 10 + movement_limit 3 | All apply |
| Pre/Post 30 + Max Shift End 6PM + Max Last Appt 4PM | First ≥ 9:00, last ≤ 3:30 |
| Min Time 5 + Min Distance 0.5 + Max Distance 10 + Max Shift Travel 120 | Soft best effort; hard not exceeded |

## Sheet errata (apply before judging)

- WB "Logic fix": combos without Default Service Hours (rows 4, 15, 19, 23, 25, 44, 54,
  60, 84, 94, 98, 114, 119, 126 …) wrongly expect first ≥ 9AM / last ≤ 5:30PM. Correct
  expectation: system default hours ± Pre/Post.
- WB #2 expects "16th job not assigned" with Max Jobs = 10: correct is job 11.
- RE: all 255 combos use Preferred Tech **Soft**; Strict mode is untested. Add Strict
  expectations from the edge rows.
- RE edge #259 (0.5mi vs 10mi "gap") is not a conflict. Correct edge: Min 15mi > Max
  10mi → target unreachable.
- CR #253 text "month stricter": week is narrower; use intersection.
- Summary field counts (RE 8, SC 5) vs Sheet B (RE 9/9, SC 6/6) differ only because
  Sheet B counts Soft/Strict variants separately.

## Contradictions inside the sheets → OPEN QUESTION

Report these as `OPEN QUESTION` (or `OBSERVED` with evidence); never pick a side:

1. **Max Travel Distance meaning.** Module references: total travel per shift. RE #263:
   radius from technician. Check both when evidence allows; label which one held.
2. **force_tech vs Skill Matching.** Sheet B #642/#656 POTENTIAL; #654 "assign B if B
   has skill" implies skill still gates force; Priority hierarchy ranks force_tech (3)
   above Skill (8).
3. **force_tech vs Region Strict.** Sheet A #33 and Sheet B POTENTIAL; hierarchy ranks
   force_tech (3) above Region Strict (7).
4. **force_tech vs Day Exclusion.** Sheet A #40, CR #262 POTENTIAL; hierarchy ranks
   force_tech (3) above Day Exclusions (15).
5. **lock + exclude.** CR #250 rule-status conflict vs Sheet B #658 exclude wins (both
   accepted; see logic).
6. **Arrival Window Override placement impact.** Class Hard and "override Time Window",
   but the sheets only state displayed window values. Whether it constrains placement is
   not stated.
7. **Preferred Jobs > Max Jobs.** WB #3 tests Preferred 12 alone while WB #2 uses Max
   10; the sheets never define validation or clamping for Preferred > Max.
8. Soft-preference order (Preferred Soft vs Customer Pref vs prefer_tech); Min Time vs
   Min Distance; same status in Ignore and Route around; no skilled tech; prefer_tech
   with inactive tech; multiple matching custom rules; exclude-only route; zero-length
   display windows.
9. **Max Last Appointment boundary.** Sheet C RR Cross-Module #14 writes `start <=
   cutoff`; the start-based override in `mantis-rule-logic.md` #16 uses `start <
   cutoff`. Only `start == cutoff` is open.
10. **CR `keep_period(week)` week start.** Use Sunday–Saturday for both the system Keep
    Original Period rule and the CR primitive. Compute the week key from the Sunday
    start date; do not use ISO week numbers or report an `OPEN QUESTION` merely because
    ISO and Sunday-start periods differ.
11. **Cross-Tech OFF vs a rule that needs another technician** (Preferred Strict, RR
    Cross-Module #12; `force_tech`, #24). Any technician change is FAIL; whether the job
    shows as unassigned or as a rule conflict is open.

## Recorded test status (Sheet A)

Use to label known defects as "previously reported"; re-verify against the new stream.

| Tab | Status | Run Routing |
|---|---|---|
| Workforce Boundaries | 7 Passed / 7 Failed / 120 blank | 11 Passed / 16 Failed |
| Route Efficiency | 9 Passed / 2 Failed / 252 blank | — |
| Service Commitments | 2 Passed / 2 Failed(cannot verify) / 56 blank | — |

Known failures: WB #1 Service Hours (bug #2, #12); WB #2 Max Jobs (bug #1; run note
r_07 Max per day = 12); WB #3 Preferred Jobs (bug #13–15; r_08 Preferred = 10); WB #6
Workload Fairness (bug #17; r_09); WB #12 Service Hours + Fairness (bug #22); WB #14 Max
10 + Preferred 7; WB #15 Max 12 + Pre/Post 1h30; RE #6 Route around passed with bug #8;
RE #8 Skill Matching (r_16); RE #10 Min Travel Time + Max Travel Distance; SC #3 Region
Strict, #4 Customer Pref, #5 Drive Buffer (cannot verify); SC #1 passed with bug #3.

Sheet C: all 77 cases `Not Run`.

Local `test/` reports that conflict with Sheet C — do not cite them as "previously
reported" without re-verifying:

- `bug1.md`, `bug2.md` Keep Week: Mon 21/09 or Tue 22/09 → Sun 20/09 (2026), reported as
  week 39 → 38. Sunday–Saturday puts both dates in 20/09–26/09 (same week).
- `bug5.md` Bug 2 Keep Week: Sun 27/09 → Mon 28/09, reported as ISO week 39 → 40; both
  dates are in 27/09–03/10 (same week).
- `bug5.md` Bug 1 Optimization Window: FAIL only because a loaded job landed after the
  horizon; Sheet C `Routing Rules` #16 allows that when Freeze, Restrict, and Keep
  Period hold.
