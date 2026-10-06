# Mantis autopilot audit — problematic probes only

> **Superseded by [bug11.md](bug11.md).** The older 100-case capture files were cleaned after the final Freeze4/Auto-Pilot14 run.

Batch: 100 read-only GET probes using the supplied schedule IDs and date ranges.

Only probes with a transport problem or a distinct configuration mismatch are retained below. Probes that completed without a new issue are excluded from this report and their raw captures were deleted.

## Problematic probes

### ⚠️ CANDIDATE — Case 001 — resolved routing settings do not match the checklist

```text
schedule_ids=17486
start=2026-09-13T00:00:00.000Z
end=2026-09-20T23:59:59.999Z
http=200
```

Classification: `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)`

The response resolves these values differently from the requested checklist:

```text
Optimization Window: 7 days (expected 14)
Default Service Hours: 07:00–17:00 (expected 08:30–18:00)
Preferred Jobs per Day: 8 (expected 10)
Minimize Travel Distance: 3 miles (expected 0.5)
Technician Skill Matching: OFF (expected ON)
Region Enforcement: strict (expected soft)
Drive Buffer: 0 minutes/OFF (expected 10)
```

The response does not prove whether the checklist was saved before the run. A settings GET/readback is required to convert this into a confirmed configuration bug.

### ⚠️ CANDIDATE — Case 011 — 14-day request resolves to a 7-day horizon

```text
schedule_ids=17486
start=2026-09-13T00:00:00.000Z
end=2026-09-26T23:59:59.999Z
http=200
resolved_horizon_end=2026-09-20T23:59:59
```

Classification: `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)`

The request covers 14 days, but the response resolves `horizon_end` to 2026-09-20, which is 7 days from the account-local horizon start. This is retained as evidence of the horizon mismatch.

### ⚠️ CANDIDATE — Case 021 — 21-day request resolves to a 7-day horizon

```text
schedule_ids=17486
start=2026-09-13T00:00:00.000Z
end=2026-10-03T23:59:59.999Z
http=200
resolved_horizon_end=2026-09-20T23:59:59
```

Classification: `UNVERIFIABLE (setup: REVIEW_SETUP_MISMATCH)`

The request covers 21 days, but the response still resolves a 7-day horizon. This confirms the same mismatch under a longer requested range without retaining duplicate captures for every schedule combination.

### ❌ FAILED — Case 051 — request timed out without an API response

```text
schedule_ids=17486
start=2026-09-16T00:00:00.000Z
end=2026-09-29T23:59:59.999Z
http=000
bytes=0
timeout_seconds=69.423171
curl_exit=28
```

Classification: ❌ **FAIL** — observed transport timeout; routing result is `UNVERIFIABLE`

The GET request produced no response body, so the optimizer result cannot be audited for this probe.

## Batch cleanup result

```text
probes_run=100
problematic_captures_retained_at_run=4
successful_captures_deleted=96
confirmed_rule_FAIL=0
observed_transport_FAIL=1
confirmed_SCHEMA_FAIL=0
```

The four historical captures from this superseded run were cleaned. Case 051 had an empty response-body capture. Final evidence is retained under `captures/` and documented in [bug11.md](bug11.md). This report contains no customer names, locations, addresses, coordinates, phone numbers, or tokens.

## Open questions

- Confirm the saved settings with a settings GET/readback before classifying the configuration mismatches as product bugs.
- Investigate the timeout in case 051 with server/request logs.
