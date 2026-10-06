# Bug file format (`test/bugN.md`)

Write one bug file per audit that has at least one `FAIL` or `SCHEMA FAIL`. The format
follows the existing files in `test/` (newest style: `bug5.md`).

## File rules

- Path: `test/bug<N>.md`, N = highest existing `test/bug*.md` number + 1. Never overwrite
  an existing file, including an empty one.
- `test/` is committed: no tokens, no customer or location names, no addresses, no phone
  numbers, no raw stream. Use IDs (optimization, event, job, schedule), dates, times,
  distances, durations, and counts only. Raw output stays in `captures/` (gitignored);
  cite its path.
- Order bugs by severity: `SCHEMA FAIL`, hard-rule `FAIL`, custom-rule `FAIL`, flow
  `FAIL`. `OPEN QUESTION` and `UNVERIFIABLE` are listed, never written as bugs.
- Headings and labels in English; explanations may follow the user's language.
- Week claims name the Sunday–Saturday date range, never ISO week numbers. A job placed
  outside the Optimization Window is not a bug by itself (`routing-rules-logic.md`).

## Template

````markdown
| Rule | Config | Result |
| --- | ---: | --- |
| Freeze Window | Until end of work day | ✅ PASS |
| **Keep Original Period** | **Week** | ❌ **FAIL** |
| Day Exclusions | ON | ⚠️ UNVERIFIABLE — API returns no exclusion rows |

Custom rules (only when supplied)

| Rule | Assertion | Result |
| --- | --- | --- |
| Same customer location | All jobs of a location on one day | ❌ **FAIL** |

Routing validation result

✅ Freeze Window: first optimized date is 2026-09-15; frozen jobs unchanged.
❌ Keep Original Period = Week: event 206433730 moves Sat 2026-09-26 → Sun 2026-09-27 (week 20/09–26/09 → 27/09–03/10).
⚠️ Day Exclusions: no exclusion rows in the response.

## Bug 1 — Keep Original Period = Week is not respected

Run: S1 · optimization_id `opt_sandbox_…` · schedule 17486
Sheet case: Workforce Boundaries #… (or "no exact sheet row")

```text
event 206433730 / job 206599914
Before: 2026-09-26T10:00:00+00:00 (Sat), schedule 17486
After:  2026-09-27T07:16:00+00:00 (Sun), schedule 17486
```

Expected: the job stays inside its original Sunday–Saturday week (20/09–26/09).

Actual: the job moves to the next Sunday–Saturday week (27/09–03/10).

Previously reported: bug3.md (only when the same rule and evidence already exist)

## Run summary

| Run | Requested schedules | Calendar jobs | Optimized jobs | Result |
| --- | --- | ---: | ---: | --- |
| S1 | 17486 | 155 | 38 | success |
| S2 | 17486, 86 | 159 | 35 | success |

Raw output: `captures/260914-1637-S1.txt`, `captures/260914-1637-S2.txt` (local only).

## Open questions

- force_tech vs Region Strict: sheet marks POTENTIAL CONFLICT; engine kept Region (OBSERVED).

## Not verifiable from these curls

- Preferred technician matching: no job in scope has a preferred technician.
````

## Result markers

| Verdict | Marker in file |
|---|---|
| PASS | `✅ PASS` |
| FAIL, SCHEMA FAIL | `❌ **FAIL**` / `❌ **SCHEMA FAIL**` (bold the rule and config cells) |
| UNVERIFIABLE, OPEN QUESTION, OBSERVED, NOT SUPPLIED | `⚠️` + label + short reason |
