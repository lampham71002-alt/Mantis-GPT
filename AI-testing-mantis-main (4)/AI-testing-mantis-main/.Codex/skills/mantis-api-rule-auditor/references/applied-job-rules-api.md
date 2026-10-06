# Applied Job Rules API contract

Source: the Apidog page linked from the DES-9619 Jira comment:
`https://yesdjal5yn.apidog.io/get-applied-job-rules-43363781e0`

## Request

`GET /api/routing/mantis/job-rules`

Required query parameters:

- `optimization_id`: sandbox optimize/autopilot ID, normally `opt_sandbox_*`.
- `job_event_id`: integer `event.id` from the cached optimize preview.

Required header:

- `token`: user access token. Never include its value in a report.

The endpoint is for the Sandbox Applied Rules modal. It is not the optimize operation,
not the accept operation, and not a substitute for activity feeds.

## Response shape

Success envelope:

```json
{
  "success": true,
  "message": [],
  "data": {
    "job_event_id": 11,
    "job_id": 7,
    "schedule_id": 2,
    "optimized_start": 1749634200,
    "before_start": 1749630600,
    "moved": true,
    "job": {
      "customer": {},
      "service_name": "...",
      "location": {},
      "technician": {},
      "length": 30,
      "start": "...+00:00",
      "end": "...+00:00",
      "status": 1,
      "status_type": 1,
      "status_name": "Confirmed"
    },
    "rules": {
      "system": [],
      "custom": [],
      "specific": []
    },
    "rule_attribution": []
  }
}
```

The Apidog success example is synthetic. Validate live `data` against the source
optimize event. Do not assume the example IDs, dates, customer, or rule text. Check
each rule item for identity, type/category, active status, and consistency with the
current checklist. Inspect exact live `rule_attribution` objects; do not invent fields.

## Expected errors

- `404 Record Not Found`: invalid/expired optimization or event join, or job not in the
  cached preview. Report an evidence/join failure, not “no rules applied”.
- `422 Parameter Error`: missing or invalid required query parameter. Report input
  failure and do not judge routing semantics.
- `success: true` with empty rule arrays can be valid when no active rule applies, but
  only after checking the active checklist and whether the job was moved.

## Audit assertions

1. Request IDs join to the same Sandbox preview and job event.
2. `moved` agrees with `before_start` vs `optimized_start` and the jobs stream.
3. Schedule, technician, start/end, length, and status agree with the source.
4. Every listed System/Custom/Specific rule is active and applicable to the job.
5. Every expected applied rule is present; missing attribution is a FAIL for
   explainability unless the live contract explicitly says the array is summary-only.
6. Rule prose cannot override a structured checklist value; prose is supporting evidence.
7. This endpoint alone yields `PASS (explainability-only)` at most. Full route PASS
   needs placement checks and, where available, errors/history feeds.
