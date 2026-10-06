# Embedded Mantis rule logic

Self-contained rule engine for Mantis routing audits. It is a normalized extraction of
the three rule workbooks:

- **Sheet A** `DES-9169 mantis-all-rules-combined` (ID
  `1CTx90uik29jfR3blBCX2DaQbny8I-mf-9qZNg0xxMKI`): tabs `Summary`, `Workforce
  Boundaries`, `Route Efficiency`, `Service Commitments`, `Custom Rules`,
  `Cross-Module`, `Module references`, `Priority hierarchy` (773 cases).
- **Sheet B** `DES-9619 Cross-Module Combos` (ID
  `1XsdOSniohSpcV_mS4RhbmMsej41FC_4eEaVdX73zSEI`): tab `Cross-Module Combos`
  (663 cases, fields covered WB 7/7, RE 9/9, SC 6/6, CR 11/11).
- **Sheet C** `MANTIS_ROUTING_RULES_TESTCASES_FOR_DES9169_DES9619_V1.xlsx` (ID
  `1UV7tzlqwkAS3pNVWTvFJGhkosMhw1E3T`, V1 draft): tabs `README`, `Routing Rules`
  (49 cases), `RR Cross-Module` (28 cases), plus its companion logic Markdown. The
  Routing Rules (gate) oracle lives in `routing-rules-logic.md`.

Per-tab edge cases, sheet errata, sheet-internal contradictions, and recorded test
status live in `sheet-case-catalog.md`; every sheet row is snapshotted in `cases/`.
Jira flow logic lives in `des-9619-decisions.md`. Do not require the user to resend the
sheets.

## Source precedence

1. Explicit values in the current user checklist configure the run.
2. **The sheets define rule semantics, class (hard/soft/display), precedence, and
   expected outcomes.** `Module references` + `Priority hierarchy` define class and
   order; module tabs and Sheet B define expected outcomes; Sheet C defines the seven
   Routing Rules fields and their cross-module interactions (`routing-rules-logic.md`).
   Where Sheet C contradicts Sheet A/B or a documented override below, report
   `OPEN QUESTION`.
3. Jira DES-9619 defines product flow, screen logic, metric formulas, and the date gate
   formula (`des-9619-decisions.md`). When a Jira comment conflicts with a sheet rule
   class or expected outcome — including Sheet C gate semantics — the sheet decides the
   verdict and the Jira note is context.
4. Repository artifacts (`rules-catalog.md`, `priority-hierarchy.md`, `test-matrix.md`)
   are secondary. When they differ from the sheets, follow the sheets and report the
   difference.
5. Raw API behavior is `OBSERVED`; it never silently changes the expected rule.

A sheet that contradicts itself, or a `POTENTIAL CONFLICT` / "verify: X or Y?" row, is
`OPEN QUESTION`. A missing field needed to verify a claim is `UNVERIFIABLE`. Do not turn
either into a guessed PASS or FAIL.

## Checklist input contract

Require a non-empty `Checklist rules` block or a non-empty `Custom rules:` block before any
curl/API audit. When both are missing or have no valid line, send the missing-checklist reply from `SKILL.md` §Mandatory
checklist gate (short example + full template), never a bare refusal. Accept one system
rule per non-empty line in any of these forms:

```text
Rule<TAB>Config
Rule  Config
Rule: Config
Rule = Config
```

Normalize case, whitespace, hyphens, underscores, `±`, plurals, and units. Match the
longest known label first (`Max Shift Travel Time` must not become `Max Travel`).
Normalize ON/OFF, soft/strict, days, minutes, hours, miles, clock times, week/month,
status lists, and `±N days`. Preserve each original line beside its normalized value.

A listed rule is active with the supplied value. An omitted rule is `NOT SUPPLIED`
(no constraint may be invented), not an implied OFF. Use `OFF` only when explicitly
supplied or returned by the API. A rule that requires a value but has none is
`SETTINGS INPUT ERROR`. Unknown labels, conflicting duplicates, and malformed values
are `SETTINGS INPUT ERROR`.

`Default Service Hours ON` without start/end, or `OFF`, means the **system default
hours** apply. The sheets do not define those hours: take them from the API payload
(`default_service_hours.start/end`) or mark window checks `UNVERIFIABLE`. Never assume
a clock range.

### Custom Rules input

Custom rules are a dynamic, user-authored array (zero, one, or many natural-language
rules). Accept them in an optional `Custom rules:` block: omitted → `NOT SUPPLIED`;
`none` / `[]` → explicitly zero rules; otherwise each rule as written in Mantis (title +
`Rule:` text) or the `routing/mantis/custom-rules` JSON. Interpret every rule into
testable assertions and map them to the sheet primitives below when the meaning is the
same, following `custom-rules-dynamic.md` (input forms, interpretation procedure,
primitive map, conflicts, worked example). Never infer custom rules from Jira, API
prose, or job notes.

### Rule definitions

One reference per rule: **name** (canonical key, class), plain-language definition,
an example, and any QA field note (dependency, setup steps, or a flag against the
sheet). Canonical key and class stay authoritative for the API mapping and priority
order below.

**Routing Rules (gate)** — Sheet C; not part of the 31 Sheet A fields. Oracle, evidence
strength, comparative protocol, and interactions: `routing-rules-logic.md`.

- **Auto-Pilot Run Frequency** (`auto_optimization`, Metadata) — Controls when
  autopilot runs. A config readback proves configuration only; runtime activation needs
  its own time-series evidence.
- **Freeze Window** (`freeze_window_days`, Gate, Hard) — `N days` freezes Today …
  Today+N−1 in calendar days; `Until end of work day` freezes today (first optimizable
  date = tomorrow). A frozen job keeps date, time, and technician.
- **Optimization Window / Optimization Horizon** (`optimization_horizon`, Gate) —
  Horizon `[today, today + M − 1]`; the open loaded range starts at today + freeze.
  Not a final destination boundary: a loaded job placed outside it is not FAIL by
  itself.
- **Restrict Job Movement** (`job_movement_restriction_days`, Gate, Hard) —
  `|AFTER date − BASELINE date| ≤ N`; `0` keeps the date (time may change); OFF sets
  no date-distance limit.
- **Keep Original Period** (`preserve_original_period`, Gate, Hard) — Week: same
  **Sunday–Saturday** week (never ISO Monday–Sunday); Month: same calendar month and
  year.
  Use `week_start = date - ((date.weekday() + 1) % 7 days)` as the week key.
- **Route Across All Tech Schedules** (`allow_cross_technician_routing`, Gate, Hard
  when OFF) — Resolve schedule → technician first. OFF: technician identity must not
  change (moving between two schedules of the same technician is allowed). ON: a change
  is allowed, never required. Several rules below depend on this setting.

**Workforce Boundaries (WB) — 7**

1. **Default Service Hours** (`default_service_hours`, Hard) — Jobs may only be
   ranked inside the configured start–end window; a job outside it is a violation.
   *Ex:* start–end = 8:30 AM–6:00 PM → a job routed outside that range
   (< 8:30 AM or ≥ 6:00 PM) is a violation.
2. **Max Jobs per Day** (`max_jobs_per_day`, Hard) — Caps jobs per tech per day; a
   job beyond the cap is not assigned and is a violation.
   *Ex:* cap = 10 → the 11th job that day for that tech is not assigned — a
   violation. (Sheet A's own worked example says "16th job" for the same cap = 10
   — that is a sheet typo; N+1 is the correct formula.)
3. **Preferred Jobs per Day** (`preferred_jobs_per_day`, Soft) — Target job count
   per day, not a hard limit; Max Jobs per Day is the real ceiling.
   *Ex:* Preferred = 10, Max = 15 → the system aims for 10/day but may still fill up
   to 15 when busy.
4. **Pre/Post-Shift Travel Time** (`shift_travel_minutes`, Hard) — Travel time
   before/after the shift must fit inside Service Hours, shrinking the effective
   window.
   *Ex:* Service Hours 8:30 AM–6 PM, travel = 30 min → effective window becomes
   9:00 AM–5:30 PM.
5. **Max Shift End Time** (`max_shift_end_time`, Hard) — Absolute end-of-shift
   cutoff; no job may end after it, even if Service Hours would allow later.
   *Ex:* Service Hours end at 6:00 PM but Max Shift End = 5:00 PM → a job ending
   after 5:00 PM is a violation, even though Service Hours still allows until 6:00 PM.
6. **Workload Fairness** (`workload_balance`, Soft) — Balances job load/travel time
   evenly across techs. Depends on **Route Across All Tech Schedules**: ON allows
   redistribution across other techs; OFF limits balancing to the same tech's own
   day. Never FAILs alone, but an uneven split should raise a **warning** for
   investigation even when the verdict is PASS.
   *Ex:* 3 techs, 30 jobs/day → ~10 each; if one tech gets 25 and the other two get
   2–3, flag a warning even though it's not a hard FAIL.
7. **Day Exclusions** (`day_exclusions`, Hard) — A tech configured off on a weekday
   takes no jobs that day; value `Tech: Day[, Day]` or `ON` (take excluded rows from
   the API; no rows → `UNVERIFIABLE`). Whether those jobs move to another tech
   depends on **Route Across All Tech Schedules**: ON reassigns to another tech;
   OFF only allows moving to another day for the same tech (within Restrict Job
   Movement), or leaves it unassigned if no valid day remains.
   *Ex:* Tech A off Monday — ON → Monday's job moves to another tech; OFF → it can
   only move to another day still worked by Tech A.

**Route Efficiency (RE) — 8**

8. **Minimize Travel Time** (`minimize_travel_time_minutes`, Soft) — Optimization
   objective to reduce travel time; not a hard stop.
   *Ex:* target = 5 min → the system prefers the lowest total travel time it can
   find, without being forced to hit exactly 5 min.
9. **Minimize Travel Distance** (`minimize_travel_distance_miles`, Soft) —
   Optimization objective to reduce travel distance; not a hard stop.
   *Ex:* target = 0.5 mi → a reference target for optimization, not a cap (unlike
   Maximum Travel Distance, which is a hard cap).
10. **Maximum Travel Distance** (`max_travel_distance_miles`, Hard) — Hard cap on
    total travel distance per shift.
    *Ex:* cap = 10 mi → total travel distance per shift over 10 mi is a violation.
11. **Max Shift Travel Time Limit** (`max_shift_travel_time_minutes`, Hard) — Hard
    cap on total travel time per shift.
    *Ex:* cap = 120 min → total travel time per shift over 120 min is a violation.
12. **Do Not Reroute: Ignore (statuses)** (`do_not_reroute_statuses`, Hard) — A job
    with a listed status is skipped during routing; its slot is freed for another
    job to use. Selectable statuses in the UI: `Confirmed, Unconfirmed, Reschedule,
    Pending Confirmation, Pending Booking`, plus a `Custom status` option
    ("Cancelled"/"In Progress" are not selectable — don't use them in examples or
    checklists).
    *Ex:* status "Unconfirmed" set to Ignore → an Unconfirmed job is skipped and
    another job can take its slot.
13. **Do Not Reroute: Route Around (statuses)** (`route_around_statuses`, Hard) — A
    job with a listed status is skipped and its slot stays blocked for other jobs.
    Same selectable status list as Ignore above.
    *Ex:* status "Reschedule" set to Route Around → a Reschedule job is skipped and
    its slot stays blocked entirely.
14. **Preferred Technician Matching** (`preferred_tech_matching`, Soft/Strict) —
    Soft: prefers the specified tech but falls back to another if unavailable.
    Strict: must be the specified tech, no fallback — job goes unassigned if
    unavailable. For Strict to move the job to the preferred tech, **Route Across All
    Tech Schedules must be ON**; if OFF, the job keeps its current technician.
    *Ex:* Soft, "Chris" busy → job goes to another tech. Strict + ON, Chris is on a
    different schedule but free → system finds and assigns Chris there. Strict +
    OFF, the job's current tech is not Chris → reassigning it (to Chris or anyone) is
    FAIL; whether it shows as unassigned or as a conflict is `OPEN QUESTION` (Sheet C
    RR Cross-Module #12). Soft + OFF never forces a tech change (#11).
15. **Technician Skill Matching** (`tech_skill_matching`, Hard) — The service type
    must match the assigned tech's skill; a mismatch means the job can't be placed
    there.
    *Ex:* job needs "Electrical" skill, tech lacks it → job cannot be assigned to
    that tech.
    *Setup:* Mantis add-on → "Technician Skills" tab → Manage → add the skill →
    "Manage User Preferences" → assign the skill to the tech → Customer → Location
    → Preferences tab → assign the tech as Preferred Technician → Save.

**Service Commitments (SC) — 5**

16. **Max Last Appointment Departure Time** (`max_departure_time`, Hard) — Gates the
    **start** time of the last appointment, not the end: `start > cutoff` is a
    violation; `start < cutoff` is valid even if `end` runs past the cutoff;
    `start == cutoff` is `OPEN QUESTION` (this override reads `<`, Sheet C RR
    Cross-Module #14 reads `<=`).
    **Deliberate override of Sheet A Service Commitments wording** ("no jobs will
    end after cutoff" — end-based): confirmed start-based by Jira
    [AI-470](https://gorilladesk1.atlassian.net/browse/AI-470) ("set the time
    technicians should **stop taking jobs** before shift end") and by manual QA
    verification. Per normal source precedence the sheet would win over Jira, but
    this reading is kept intentionally because the PRD (AI-470) and hands-on QA
    verification both agree against the sheet's wording alone. Re-open this if the
    sheet is corrected or new evidence contradicts it.
    *Ex:* cutoff = 4:00 PM → a job starting after 4:00 PM is a violation (exactly
    4:00 PM is `OPEN QUESTION`); a
    job starting at 3:45 PM (even if it runs until 4:30 PM) is still valid.
17. **Arrival Window Duration Override** (`arrival_window_hours`, Hard) — Overrides
    the customer-facing display window (start ± H/2, clamped to Service Hours);
    affects display only, not actual routing. If the job already had a time
    window, applying this rule overrides/replaces it.
    *Ex:* setup = 2h, job at 1:00 PM → customer-facing window shown is
    12:00 PM–2:00 PM.
18. **Region Enforcement** (`region_enforcement`, Soft/Strict) — Soft: out-of-region
    jobs are still ranked but deprioritized. Strict: out-of-region jobs are blocked
    entirely.
    *Ex:* Soft → an out-of-region job still gets placed but with lower priority.
    Strict → an out-of-region job is blocked outright.
19. **Customer Scheduling Preferences** (`customer_scheduling_preferences`, Soft) —
    Best-effort honoring of the customer's stated scheduling preference. Never
    FAILs alone, but a PASS verdict with jobs that still don't honor the stated
    preference should carry a **warning** for investigation rather than a silent
    PASS.
    *Ex:* customer requests morning → the system prioritizes placing the job in
    the morning when possible.
20. **Add Drive Buffer Time** (`drive_buffer`, Hard) — Adds a buffer on top of the
    actual drive time between jobs.
    *Ex:* buffer = 10 min, actual drive time = 4 min → total counted time = 14 min.

**Custom Rules (CR) — 11 sheet primitives**

These are the fixed CR primitives from Sheet A/B. A dynamic, user-authored custom
rule is interpreted into these primitives (or new assertions) per
`custom-rules-dynamic.md`.

21. **`keep_period`** (Hard) — Job must stay inside its original week/month.
    *Ex:* `week` → a job in week X must stay in week X after optimizing, never move
    to week Y.
22. **`force_tech`** (Hard) — Job must be assigned to the specified tech,
    overriding Preferred Tech (RE) and Workload Fairness (WB).
    *Ex:* `force_tech = "Chris"` → the job always goes to Chris, even if that
    breaches Preferred Tech or Workload Fairness.
23. **`prefer_tech`** (Soft) — Prefers the specified tech if available, with
    fallback.
    *Ex:* `prefer_tech = "Chris"` → prefers Chris; if Chris is busy, another tech
    can take it.
24. **`movement_limit`** (Hard) — Job may move at most N days from its original
    schedule.
    *Ex:* `max_days = 3` → the job can shift at most 3 days.
25. **`time_window` (strict)** (Hard) — Job must arrive inside the specified
    window.
    *Ex:* `[08:00–14:00]` → arriving outside that window is a violation.
26. **`time_window` (soft)** (Soft) — Prefers the specified window but still allows
    placement outside it if needed.
    *Ex:* `[08:00–12:00]` → preferred, not mandatory.
27. **`arrival_window_duration`** (Display) — Customer notification window only; no
    effect on actual routing.
    *Ex:* `3600s` (±30 min) → only changes what the customer sees, not where the
    job is actually routed.
28. **`first_stop` / `last_stop`** (Hard) — Job must be the tech's first / last
    stop of the day.
    *Ex:* a job with `first_stop` is always scheduled first; with `last_stop`,
    always last.
29. **`lock`** (Hard) — Job's position is fixed; autopilot routes around it.
    *Ex:* a locked job keeps its time/position; other jobs must route around it.
30. **`exclude`** (Hard) — Job is removed from routing entirely; no other rule
    applies to it.
    *Ex:* an excluded job disappears from the entire routing process — no other
    rule affects it.

### API payload mapping

The jobs stream exposes the resolved configuration and per-job evidence in
`feature_test_log`; its field map is `feature-test-log.md`. The settings payload keys
below are used when a settings response is supplied.

```text
workforce_boundaries.default_service_hours = {status|system_default, start, end}
workforce_boundaries.max_jobs_per_day = {status, value}
workforce_boundaries.preferred_jobs_per_day = {status, value}
workforce_boundaries.shift_travel_minutes = {status, value}
workforce_boundaries.max_shift_end_time = {status, value}
workforce_boundaries.workload_balance = 0|1
workforce_boundaries.day_exclusions = {status, value[]}
route_efficiency.minimize_travel_time_minutes = {status, value}
route_efficiency.minimize_travel_distance_miles = {status, value}
route_efficiency.max_travel_distance_miles = {status, value}
route_efficiency.max_shift_travel_time_minutes = {status, value}
route_efficiency.do_not_reroute_statuses = {status, value[]}
route_efficiency.route_around_statuses = {status, value[]}
route_efficiency.preferred_tech_matching = {status, value: soft|strict}
route_efficiency.tech_skill_matching = 0|1
service_commitments.max_departure_time = {status, value}
service_commitments.arrival_window_hours = {status, value}
service_commitments.region_enforcement = {status, value: soft|strict}
service_commitments.customer_scheduling_preferences = 0|1
service_commitments.drive_buffer = {status, value}
custom rules = v1/routing/mantis/custom-rules actions
routing = auto_optimization, freeze_window_days, optimization_horizon,
          job_movement_restriction_days, preserve_original_period,
          allow_cross_technician_routing
```

`status=0` means the system rule is OFF and system default applies. A missing response
field is missing evidence, not OFF. `overtime_protection_enabled` is outside the 31
sheet fields; report it separately when supplied.

## Priority order (`Priority hierarchy` tab)

When rules conflict on the same job, apply the first applicable rule:

1. `exclude` (CR) — overrides ALL other rules.
2. `lock` (CR) — autopilot routes around, no movement.
3. `force_tech` (CR) — overrides Preferred Tech (RE) and Workload Fairness (WB).
4. strict `time_window` (CR) — narrower than Service Hours, Max Shift End, Max Last Appt.
5. Max Last Appointment (SC) — wins over Max Shift End if earlier.
6. Max Shift End (WB) — wins over Service Hours.
7. Region Enforcement Strict (SC) — wins over Preferred Tech (RE).
8. Skill Matching (RE) — wins over Preferred Tech (RE).
9. `keep_period` (CR) — wins over `movement_limit` if movement exceeds period.
10. `movement_limit` (CR).
11. Service Hours (WB).
12. Max Jobs (WB) — hard cap jobs/tech/day.
13. Max Travel Distance (RE) — hard cap.
14. Max Shift Travel (RE) — hard cap.
15. Day Exclusions (WB).
16. Arrival Window Override (SC) — overrides displayed customer Time Window.
17. `first_stop` / `last_stop` (CR).
18. Workload Fairness (WB) — soft, overridden by `force_tech`.
19. Preferred Tech Soft (RE) — soft, overridden by `force_tech`.
20. `prefer_tech` (CR) — soft, overridden by `force_tech`.
21. Min Travel Time (RE) — soft, best effort.
22. Min Travel Distance (RE) — soft, best effort.
23. Customer Scheduling Preference (SC) — soft, best effort.
24. Preferred Jobs (WB) — soft, under Max Jobs.
25. `arrival_window_duration` (CR) — display only.
26. soft `time_window` (CR) — under strict.
27. Preferred Tech Strict (RE) — no fallback, but under `force_tech`.

Rank 27 means "no fallback technician", not highest global priority. A rank can only
resolve a conflict the sheets do not mark `POTENTIAL`; rows the sheets leave open stay
`OPEN QUESTION` even when the rank suggests a winner (see catalog §Contradictions).

Routing Rules (Freeze, Restrict, Keep Original Period, Cross-Tech OFF) have no rank:
they are upstream system constraints that intersect every rule above, and no custom or
specific rule loosens them (Sheet C RR Cross-Module #17–#25). When a mapped CR
primitive would need to loosen one (e.g. `force_tech` to another technician with
Cross-Tech OFF), the illegal placement is FAIL and its conflict presentation is
`OPEN QUESTION`.

## Composition and calculations

### Time window math

- Effective first-job start = `service_start + pre_shift_travel`.
- Effective last-job end = `min(service_end, max_shift_end) − post_shift_travel`
  (Sheet B #660: 8:30 start + 30 min → first ≥ 9:00).
- Max Last Appointment Departure Time constrains the last job's **start**, not its
  end (confirmed by QA — see Rule definitions #16): the job must have
  `start < max_last_appt`; its `end` may run past the cutoff. Do not fold
  `max_last_appt` into the effective-end formula above.
- Strict `time_window` intersects the effective start/end interval and wins
  (Sheet B #653/#657 order: `time_window(8–14) > Max Last Appt(4PM) > Max Shift
  End(6PM) > Service Hours`, read as "start-side" precedence for Max Last Appt).
- A job fits only if its whole duration fits inside Service Hours/Max Shift End:
  strict `[8–12]` + 4 h job → unassigned when not enough time. For Max Last
  Appointment, only the start is checked against the cutoff: a 3 PM start with a
  2 h job (ending 5 PM) is valid against a 4 PM cutoff, since 3 PM < 4 PM.
- Equality is allowed at Service Hours end / Max Shift End (ending exactly on the
  boundary is valid). For Max Last Appointment the check is `start < max_last_appt`;
  a start exactly at the cutoff is `OPEN QUESTION` because Sheet C RR Cross-Module #14
  writes `start <= cutoff` (catalog §Contradictions). Starts before the cutoff PASS and
  starts after it FAIL under both readings.
- Service Hours OFF: window = system default hours ± Pre/Post (WB "Logic fix" errata).

### Customer window math

- SC Arrival Window Override H hours: displayed window = `[start − H/2, start + H/2]`,
  clamped to Service Hours. H = 0 → point-in-time, no window (verify UI/logic).
  The jobs stream shows `[start − H/2, end + H/2]` unclamped on every optimized job
  (2026-09 capture): report it as `OPEN QUESTION` with counts; a window matching
  neither formula is FAIL.
- CR `arrival_window_duration` S seconds: notification window = `start ± S/2`.
- Both active: sheet text "customer window = SC override ± CR duration; CR applies on
  top of SC" (Sheet A Cross-Module #38, Sheet B #650). Report the observed fields and
  whether they match that text; exact arithmetic beyond it is `OPEN QUESTION`.
- Customer Pref ON + Arrival Override: honor customer window first, apply override after
  (SC #54). Customer Pref ON with no preference set → default routing.

### Travel and capacity math

- Drive buffer adds to every drive leg before checking Max Shift Travel, Max Last Appt,
  Max Shift End, and available time (Max Shift Travel 60 + buffer 30 → effective travel
  budget 30, Sheet B #647). Buffer that pushes a job past a hard cutoff → job rejected.
- Max Travel Distance and Max Shift Travel are totals per shift (Module references).
  From the jobs stream, sum only inbound legs per schedule/day and never add `to_next`
  legs; the return leg is absent (`feature-test-log.md` §Where each check reads).
- Max Jobs is a hard per-tech/day cap. Preferred Jobs is a soft target under it;
  Preferred = Max → exactly N/day when enough jobs; Preferred 0 → no soft target.
- Min Travel target larger than the hard cap (15 mi vs 10 mi; 150 vs 120 min) is
  unreachable: expect routing as close to the cap as possible, never above it.

### Blocked-job outcome

When a hard rule leaves no valid slot, the sheets expect the job to be **not assigned /
rejected / postponed to another valid date** — never placed in violation. PASS if the
job is unassigned or moved to a slot that satisfies every hard rule; FAIL if placed
violating any hard rule. Examples: strict preferred tech unavailable, strict region
with no in-region tech, no tech within Max Travel Distance, window impossible.

### Status skip semantics

- Ignore: job keeps its placement; its slot may be reused by other jobs.
- Route around: job keeps its placement; its slot is blocked for other jobs.
- Toggle ON with empty status list → nothing skipped; all jobs reroute normally.

### Custom rule semantics (sheet primitives)

These apply to assertions mapped to a primitive. Unmapped assertions from dynamic
custom rules follow `custom-rules-dynamic.md` §Interpretation procedure.

- `match: all` requires every filter; `match: any` requires one. Inactive rules are
  ignored entirely. `preferred_tech: *` does not match a stop with null preferred tech.
- A stop matching no custom rule gets system rules only.
- `exclude` removes the job before all other rules; remaining capacity is freed
  (Max Jobs 15 with one excluded → 14 routable jobs).
- `lock` keeps the job fixed; WB/RE/SC still apply to all other jobs.
- `keep_period(week)` + `keep_period(month)` → intersection: dates in both the original
  Sunday–Saturday week and the original month (Sheet C RR Cross-Module #19), so a week
  that spans two months is cut at the month boundary.
- `keep_period(month)` + large `movement_limit` → stays inside the month.
- `movement_limit(0)` = no date movement; with strict `time_window` both apply.
- REDUNDANT (not conflict): `force_tech` + `prefer_tech` (prefer has no effect);
  `prefer_tech` (CR) + Preferred Tech (RE) (same purpose).
- Rule-level CONFLICT: `first_stop` + `last_stop` on the same stop (except a 1-stop
  route); two different `force_tech` techs on the same filter; `lock` + `exclude` (see
  below); `force_tech`/`first_stop`/`last_stop` + `exclude` (exclude wins).
- `lock` + `exclude`: Custom Rules #250 expects rule status = conflict for the user to
  resolve; Sheet B #658 expects exclude to override lock. Accept either outcome; FAIL
  only if the job stays in the route as locked with no conflict flag.

## Boundary behavior (clean zero, not crash)

- Service Hours start = end; Service Hours 8:30–9:00 with Pre/Post 30 min; strict window
  outside Service Hours (6–7 AM vs 8 AM–6 PM); Max Shift End before Service Hours start;
  Max Last Appt before Service Hours start; Max Jobs 0; Max Travel Distance 0;
  Max Shift Travel 0; all 7 days excluded for all technicians → 0 jobs scheduled.
- Day Exclusion on one weekday for all techs → no job that weekday (moved or blocked).
- Workload Fairness with only one active tech → all jobs to that tech; no balance.
- Drive Buffer 0 → drive unchanged. Very large buffer (120 min) → many jobs rejected.
- All rules OFF → default routing; no rule overridden.
- Multiple soft rules → assert improvement direction only, never an exact choice.

## Verdict contract

For each job/event compare the canonical checklist with `before` and `optimized`
placement and any reasons/feeds.

- `PASS` — every supplied hard rule and the API schema/evidence are consistent.
- `FAIL` — a supplied hard rule is breached in placement, or a sheet expected outcome
  (unassigned/excluded/window value) is contradicted.
- `SCHEMA FAIL` — contradictory available cross-event data; missing fields alone are
  `UNVERIFIABLE`. Continue independent checks with trustworthy evidence.
- `UNVERIFIABLE` — required placement, attribution, or input value is absent.
- `OPEN QUESTION` — the sheets do not settle the outcome (see catalog).
- `OBSERVED` — empirical behavior on an `OPEN QUESTION`.

Routing Rules add two qualifiers from `routing-rules-logic.md`: every PASS carries
`evidence_strength` (`SENSITIVITY_STRONG` | `HARD_ONLY`), and a wrong setup, missing
witness, or missing schedule → technician mapping is `UNVERIFIABLE` with that reason.

Soft rules never produce FAIL alone. Always separate: configured settings, normalized
settings, date gate, route correctness, rule attribution, soft trade-offs, missing
evidence, matched sheet row, and unresolved questions.
