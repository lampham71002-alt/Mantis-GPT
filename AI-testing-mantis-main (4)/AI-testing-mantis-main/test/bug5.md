| Rule                             | Config                 | Result |
| -------------------------------- | ---------------------- | ------ |
| Freeze Window                    | Until end of work day  | PASS |
| **Optimization Window**          | **14 days**            | **FAIL** |
| Restrict Job Movement            | ±2 days                | PASS |
| **Keep Original Period**         | **Week**               | **FAIL** |
| Route Across All Tech Schedules  | ON                     | PASS / redistribution |
| **Default Service Hours**        | **~7:00 AM–6:00 PM**   | **FAIL / config mismatch** |
| Max Jobs per Day                 | 12                     | PASS |
| Pre/Post-Shift Travel Time       | 15 min                 | PASS |
| Max Shift End Time               | 6:00 PM                | PASS |
| Max Last Appointment Departure   | 3:00 PM                | PASS |
| Maximum Travel Distance          | 7 miles                | PASS |
| Max Shift Travel Time            | 20 min                 | PASS |
| Day Exclusions                   | ON                     | FAIL / config mismatch |
| Arrival Window Duration Override | 2 hours                | PASS |

Bugs

Routing validation result

PASS Freeze Window: first optimized date is 2026-09-15; frozen jobs are classified as `outside_freeze_window`.
FAIL Optimization Window 14 days: one job is placed after the resolved horizon.
PASS Restrict Job Movement ±2 days: maximum observed move is 2 days.
FAIL Keep Original Period = Week: the same placement crosses from ISO week 39 to ISO week 40.
PASS Route Across All Tech Schedules: cross-schedule redistribution is observed.
FAIL Default Service Hours: API reports base `07:00–17:00`, while the supplied setting says approximately `07:00–18:00`.
PASS Max Jobs/day = 12: maximum optimized load is 3 / 4 / 4 jobs per schedule/day across the three calls.
PASS Service Hours / Max Shift End: effective operating window is `07:15–14:45`; no optimized job is outside it.
PASS Pre/Post-Shift Travel 15 min.
PASS Max Last Appointment Departure 3 PM: latest optimized end is 14:25 / 14:41 / 14:00.
PASS Max Travel Distance 7mi: maximum routed leg is 5.75 / 3.77 / 5.75mi.
PASS Max Shift Travel Time 20min: maximum summed routed travel per schedule/day is 15.77 / 13.92 / 16.02min.
FAIL Day Exclusions: API returns `active=false`, `rows=[]` although the checklist says ON.
PASS Arrival Window Override 2h: optimized fixed windows equal appointment duration plus 2 hours.

## Bug 1 — Optimization Window is breached

The API resolves the active horizon to:

```text
horizon_end = 2026-09-27T23:59:59+00:00
placement_end = 2026-09-28T00:00:00+00:00
```

Event `206433730` / job `206599914` is routed as follows in all three calls:

```text
Before: 2026-09-27T10:00:00+00:00, schedule 17486
After:  2026-09-28T07:16:00+00:00, schedule 17486
```

Expected: an optimized placement must not be later than the resolved 14-day horizon.

Actual: the job is marked `routing_status=optimized` after the horizon ended.

## Bug 2 — Keep Original Period = Week is not respected

The same event moves from Sunday to Monday:

```text
Before: Sunday 2026-09-27
After:  Monday 2026-09-28
```

Expected: the job remains inside its original calendar week.

Actual: the job crosses from ISO week 39 to ISO week 40. The movement is only one day,
so `Restrict Job Movement ±2 days` passes while `Keep Original Period = Week` fails.

## Bug 3 — Default Service Hours do not match the supplied setting

The supplied checklist says approximately `07:00–18:00`, System Default ON. The API
feature log reports:

```text
system_default = true
base service hours = 07:00–17:00
resolved operating window = 07:15–14:45
```

The effective `14:45` end is explainable by the 15-minute shift travel rule and the
earlier 3:00 PM last-departure rule. The mismatch is the base service-hours end value:
the API exposes 17:00 rather than the supplied 18:00.

## Bug 4 — Day Exclusions is ON in the checklist but inactive in the API

The checklist says `Day Exclusions = ON`, but all three responses resolve:

```text
active = false
rows = []
```

No concrete excluded weekday/technician row was supplied, so the behavioral effect of
an exclusion cannot be tested. This is currently a configuration mismatch/test-data gap,
not proof that a specific technician was routed on an excluded day.

## Run summary

| Run | Requested schedules | Calendar jobs | Optimized jobs | Result |
|---|---|---:|---:|---|
| S1 | 17486 | 155 | 38 | success |
| S2 | 17486, 86 | 159 | 35 | success |
| S3 | 17486, 215, 86 | 183 | 46 | success |

The three calls returned unique optimization IDs and completed successfully. The report
uses the terminal `feature_test_log` and optimized job fields; raw API data is not copied
here because it contains customer/location data.

## Not verifiable from these curls

Auto-Pilot frequency, routing triggers, preferred-technician matching for a job that has
an actual preference, strict region behavior with a configured region, and the direction
of the soft travel objectives require trigger/history, preference, region, or feed data.
