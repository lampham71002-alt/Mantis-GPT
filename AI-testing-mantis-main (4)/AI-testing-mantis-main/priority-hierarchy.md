# Priority Hierarchy

When two rules disagree, the one higher in this list wins. Order is verbatim from the
`Priority hierarchy` sheet of `DES-9169 mantis-all-rules-combined.xlsx`.

`(CR)` Custom Rules · `(WB)` Workforce Boundaries · `(RE)` Route Efficiency · `(SC)` Service Commitments

| # | Rule | Note |
|---|------|------|
| 1 | `exclude` (CR) | Terminal — overrides **all** other rules |
| 2 | `lock` (CR) | Job frozen; autopilot routes around it |
| 3 | `force_tech` (CR) | Overrides Preferred Tech (RE) and Workload Fairness (WB) |
| 4 | `time_window` strict (CR) | Narrower than Service Hours, Max Shift End, Max Last Appt |
| 5 | Max Last Appointment (SC) | Beats Max Shift End (WB) when earlier |
| 6 | Max Shift End (WB) | Beats Service Hours (WB) |
| 7 | Region Enforcement Strict (SC) | Beats Preferred Tech (RE) |
| 8 | Skill Matching (RE) | Beats Preferred Tech (RE) |
| 9 | `keep_period` (CR) | Beats `movement_limit` when movement would leave the period |
| 10 | `movement_limit` (CR) | Travel-day limit |
| 11 | Service Hours (WB) | Base service window |
| 12 | Max Jobs per day (WB) | Cap per tech per day |
| 13 | Max Travel Distance (RE) | Distance cap per shift |
| 14 | Max Shift Travel Time (RE) | Travel-time cap per shift |
| 15 | Day Exclusions (WB) | Tech off on a weekday |
| 16 | Arrival Window Override (SC) | Overrides the displayed customer window |
| 17 | `first_stop` / `last_stop` (CR) | Position within the day's route |
| 18 | Workload Fairness (WB) | Soft — overridden by `force_tech` |
| 19 | Preferred Tech Soft (RE) | Soft — overridden by `force_tech` |
| 20 | `prefer_tech` (CR) | Soft — overridden by `force_tech` |
| 21 | Min Travel Time (RE) | Soft objective |
| 22 | Min Travel Distance (RE) | Soft objective |
| 23 | Customer Scheduling Pref (SC) | Soft objective |
| 24 | Preferred Jobs per day (WB) | Soft target beneath Max Jobs |
| 25 | `arrival_window_duration` (CR) | Display only — no routing effect |
| 26 | `time_window` soft (CR) | Soft preference beneath the strict form |
| 27 | Preferred Tech Strict (RE) | Strict, no fallback — but still beneath `force_tech` |

Ranks **1–17** are hard constraints; **18–27** are soft/display. Rank 27 sitting last is
deliberate: "strict" here means *no fallback tech*, not *highest priority*.

---

## Resolved conflicts — assert these

| Pair | Resolution |
|------|-----------|
| `exclude` vs anything | `exclude` wins. The job never enters the route; WB/RE/SC are inert for it |
| `exclude` + `lock` on the same stop | `exclude` wins — job removed, not locked |
| `force_tech` vs Preferred Tech Strict | `force_tech` wins; the preferred tech is ignored |
| `force_tech` vs Workload Fairness | `force_tech` wins for that job; fairness still applies to the rest |
| Max Last Appt (4PM) vs Max Shift End (6PM) | Earlier cutoff wins → nothing ends after 4PM |
| `time_window` strict [8–14] vs Service Hours [8:30–18] | `time_window` wins → job only 8:00–14:00 |
| Skill Matching vs Preferred Tech Soft | Skill wins — a capable tech is assigned instead |
| Region Strict vs Customer Scheduling Pref | Region wins — no out-of-region assignment |
| `keep_period(month)` vs `movement_limit(45 days)` | `keep_period` wins — movement is clamped to the month |
| `keep_period(week)` + `keep_period(month)` | No conflict — the stricter (intersection) applies |
| `movement_limit(0)` + `keep_period(week)` | Both hold — the stop stays on its original date |
| `lock` vs Max Travel Distance | Locked job does not move; the distance cap still binds the other jobs |
| Arrival Window Override (SC) + `arrival_window_duration` (CR) | CR applies **on top of** SC |
| `force_tech(chris)` + `force_tech(alex)` on the same filter | **Rule-level conflict** — status = conflict, the user must resolve it |
| `first_stop` + `last_stop` on the same stop | **Rule-level conflict** — unless the route has exactly one stop |

## Open questions — report, never guess

The spreadsheets label these `POTENTIAL CONFLICT` and the hierarchy does not settle them.

**Most of them can be answered empirically.** Q1–Q8 all reduce to "which rule name appears
in `reasons[]`" — configure the conflict, run it, then read `feeds/errors` and
`feeds/history/:id/logs`. Record that as **OBSERVED** (what the build does today), never as
spec. Only Q9 and Q11 are genuine product-design questions with no observable answer.

If a test hits one and you cannot probe it, record the behaviour as **OPEN QUESTION** and
escalate. Never invent the resolution.

| # | Situation | Question |
|---|-----------|----------|
| Q1 | `force_tech(chris)` + Region Enforcement Strict, chris outside the region | Force wins, or region blocks? |
| Q2 | `force_tech(chris)` + Skill Matching ON, chris lacks the skill | Assign anyway, or block? |
| Q3 | `force_tech(chris)` + chris has a Day Exclusion that day | Assign anyway, or block? |
| Q4 | `prefer_tech` + tech terminated/inactive | Fallback, or unassigned? |
| Q5 | Skill Matching ON + **no** tech has the skill | Job unassigned, or skill match dropped? |
| Q6 | Same status selected in both `do_not_reroute_statuses` and `route_around_statuses` | Which semantic wins? |
| Q7 | Multiple custom rules match one stop | First match wins, all apply, or priority-ordered? |
| Q8 | Preferred Tech Soft (RE) + Customer Pref (SC) + `prefer_tech` (CR) all on | Relative order among the three soft preferences |
| Q9 | `exclude` on the only stop of a route | Empty route — is that valid? |
| Q10 | Min Travel Time vs Min Travel Distance disagree (near in time, far in distance) | Which soft objective dominates? |
| Q11 | `arrival_window_duration = 0` / Arrival Window Override `= 0h` | Point-in-time window — UI and logic behaviour undefined |

## Impossible configurations — expect zero jobs, not a crash

- Max Shift End **before** Service Hours start (e.g. 7AM vs 8AM–6PM)
- Service Hours start == end (8AM–8AM)
- Pre/Post-Shift travel ≥ the Service Hours window (30+30 min against an 8:30–9:00 window)
- `time_window` strict entirely outside Service Hours (6–7AM against 8AM–6PM)
- Max Last Appointment before Service Hours start (6AM vs 8AM)
- Max Travel Distance = 0, or Max Shift Travel = 0
- Max Jobs per day = 0
- Day Exclusions covering all 7 days for all technicians

Each must resolve to **0 jobs scheduled** with a clean, explained response.
