# Test Matrix — the 1,455-case corpus

Two workbooks, normalized into CSV under `data/`. Use the CSVs, not the `.xlsx` —
they are already flattened and de-duplicated.

## `data/module-rules-testcases.csv` — 792 rows

Columns: `module,id,group,condition,expected,conflict`

| Module | Rows | Group shape |
|--------|------|-------------|
| Workforce Boundaries | 142 | every C(7,k) combo for k = 1…7 + 7 edge + 1 errata note |
| Route Efficiency | 274 | every C(8,k) combo for k = 1…8 + 17 edge + 9 extra edge + 2 errata notes |
| Service Commitments | 60 | C(5,k) plus Soft/Strict variants of Region Enforcement + 13 edge |
| Custom Rules | 272 | tiered: full cross for 1–3 actions, greedy quads for 4–9, + 23 edge |
| Cross-Module | 44 | 1/2/3/4-module combos + 16 cross-module edge cases |

Fixed test values throughout: Service Hours 8:30AM–6PM · Max Jobs 15 · Preferred Jobs 10 ·
Pre/Post-Shift 30 min · Max Shift End 6PM · Day Exclusion "Tech A off Monday" ·
Min Travel 5 min / 0.5 mi · Max Travel 10 mi · Max Shift Travel 120 min ·
Max Last Appt 4PM · Arrival Window 2h · Drive Buffer 10 min · `time_window` strict 8–14,
soft 8–12 · `movement_limit` 3 days · `arrival_window_duration` 3600s · `force_tech` chris.

## `data/cross-module-combos.csv` — 663 rows

Columns: `id,group,wb,re,sc,cr,expected,conflict`

| Part | Group label | Rows | Construction |
|------|-------------|------|--------------|
| 1 | `4-key cross` | 256 | 4×4×4×4 over the **key** field of each module |
| 2 | `Non-key * × key` | 68 | one non-key field crossed with the key set of the others |
| 3 | `Non-key pair *×*` | 101 | non-key pairs, other modules pinned to a key value |
| 4 | `Non-key full cross` | 210 | full cross over the non-key fields |
| 5 | `Edge Case` | 28 | conflicts, impossible windows, all-hard / all-soft, all-OFF |

Coverage claim in the sheet: **WB 7/7, RE 9/9, SC 6/6, CR 11/11 = 31/31**.

### The value axes

**Key fields** (Part 1 — the 4×4×4×4):

| WB | RE | SC | CR |
|----|----|----|----|
| Default Service Hours (8:30AM–6PM) | Max Travel Distance (10mi) | Max Last Appt (4PM) | `keep_period` (week) |
| Max Jobs per day (15) | Max Shift Travel (120min) | Region Enforcement (Strict) | `force_tech` (chris) |
| Max Shift End Time (6PM) | Preferred Tech Strict | Drive Buffer Time (10min) | `time_window` strict [8-14] |
| Workload Fairness (ON) | Skill Matching (ON) | Customer Scheduling Pref (ON) | `lock` |

**Non-key fields** (Parts 2–4):

| WB | RE | SC | CR |
|----|----|----|----|
| Preferred Jobs per day (10) | Min Travel Time (5min) | Arrival Window Override (2h) | `prefer_tech`, `movement_limit (3 days)` |
| Pre/Post-Shift Travel (30min) | Min Travel Distance (0.5mi) | Region Enforcement (Soft) | `time_window` soft [8-12], `arrival_window_duration (3600s)` |
| Day Exclusions (Tech A off Mon) | Preferred Tech Soft | | `first_stop`, `last_stop`, `exclude` |
| | Ignore reroute (ON), Route around (ON) | | |

---

## Errata in the source sheets — do not propagate

Recorded by the sheet authors themselves; treat the sheet's `expected` for these rows as wrong.

1. **WB, hardcoded window.** Combos without Default Service Hours (rows 4, 15, 19, 23, 25,
   44, 54, 60, 84, 94, 98, 114, 119, 126, …) still state "first job ≥ 9AM, last ≤ 5:30PM".
   Wrong — with Service Hours OFF the **system default** applies. Correct expectation:
   `effective window = system default hours ± Pre/Post-Shift travel`. Never hardcode 8:30AM–6PM.
2. **RE, Strict untested.** All 255 RE combos use Preferred Tech **Soft**. Strict mode is
   covered only by edge cases E1 and E8. Strict needs its own pass.
3. **RE edge #259 is not an edge case.** "Min Travel Distance 0.5mi vs Max Travel Distance
   10mi" is normal — 0.5 < 10. The real case is Min **>** Max (e.g. 15mi vs 10mi): the soft
   target is unreachable inside the hard cap, and routing should approach 10mi as closely as it can.

---

## Edge cases worth running first

High signal, low cost — these break implementations most often.

**Impossible windows → expect 0 jobs**
- Service Hours 8:30–9:00 + Pre/Post 30 min → effective window 0
- Max Shift End 7AM with Service Hours 8AM–6PM
- Max Last Appt 6AM with Service Hours from 8AM
- `time_window` strict [6–7AM] against Service Hours 8:30–18
- Max Travel Distance 0 · Max Shift Travel 0 · Max Jobs per day 0
- Day Exclusions: all 7 days for all technicians

**Boundary equality → expect allowed**
- Service Hours end 6PM == Max Shift End 6PM, job finishes exactly at 6:00PM → **valid**
- Preferred Jobs == Max Jobs (both 10) → exactly 10/day when supply allows
- Max Last Appointment == Shift End → boundary OK, nothing after it

**Validation errors**
- Preferred Jobs (15) > Max Jobs (10) → blocked with a validation error, not silently clamped

**Zero-value toggles (ON but neutral)**
- Drive Buffer = 0 → drive time unchanged
- Preferred Jobs per day = 0 → no soft target; fill up to Max Jobs
- `arrival_window_duration` = 0 → point-in-time (behaviour undefined — see Q11)
- Ignore reroute / Route around ON with an empty status list → nothing is skipped

**Cascading hard rules**
- Drive Buffer 10 min pushes a job past Max Last Appt 4PM → job rejected
- Drive Buffer 120 min → many jobs rejected by the cutoff
- Max Last Appt 4PM, job duration 2h, ranked at 3PM → rejected or deferred (3PM+2h = 5PM > 4PM)
- `time_window` strict [8–12] with a 4h job → unassigned if the window cannot hold it
- Pre/Post 30 min + Max Shift End 6PM + Max Last Appt 4PM → window is 9:00AM–3:30PM; the 6PM stop is inert

**Maximum restriction / maximum freedom**
- All 8 hard constraints at once (Service Hours + Max Travel + Max Last Appt + `keep_period`
  + `force_tech` + `time_window` strict + `first_stop` + `lock`)
- All 5 soft constraints at once (Workload Fairness + Min Travel Time + Customer Pref +
  `prefer_tech` + `time_window` soft) — best-effort only, assert direction not values
- All rules OFF → pure default routing, nothing overridden (the baseline case)

---

## Querying the corpus

```bash
SKILL=.claude/skills/mantis-routing/data

# Every edge case for one module
awk -F',' '$1=="Route Efficiency" && $3=="Edge Case"' $SKILL/module-rules-testcases.csv

# Every combo the sheet flags as a conflict
awk -F',' 'NR>1 && $8!=""' $SKILL/cross-module-combos.csv

# Every combo involving force_tech
grep force_tech $SKILL/cross-module-combos.csv

# Single-rule baselines — start any verification session here
awk -F',' '$3=="1 field" || $3=="1 action"' $SKILL/module-rules-testcases.csv
```
