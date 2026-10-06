# Verification Runbook

Step-by-step for an actual session. Assumes `api-verification.md` is loaded.

## What to hand over to start

**One curl is enough.** Copy any authenticated Mantis request out of DevTools
(Network → right-click → Copy as cURL) — ideally the `manual/optimize` PUT, because it
carries the request payload too.

From that single curl everything else is derivable: the API base, `token`,
`gd-branch-id`, `platform`, and the real parameter shape. Do not ask for a list of
endpoints — they are already in `api-verification.md`.

Also state, once:
- which branch/account is safe to mutate, and whether jobs on it are seeded and stable
- whether `manual/accept` may be called (accept-then-undo cycle) or preview-only

## Step 0 — extract credentials

Parse the curl into `captures/.env.local`:

```sh
API_BASE=https://<host>/api/v1/
GD_TOKEN=<token header>
GD_BRANCH_ID=<gd-branch-id header>
```

`captures/` is gitignored. The token never goes into a committed file, a report, or a
capture directory. Strip it from anything quoted back into chat.

Helper for every call below:

```sh
set -a; . captures/.env.local; set +a
gd() { curl -s -H "token: $GD_TOKEN" -H "gd-branch-id: $GD_BRANCH_ID" \
            -H "platform: web" -H "Content-Type: application/json" "$@"; }
```

## Step 1 — smoke test

```sh
gd "${API_BASE}routing/system-rules" | head -c 400
```

Non-200 or an HTML body means the token or branch header is wrong. Stop and fix before
anything else — every later failure would be misattributed to the rule engine.

## Step 2 — config snapshot

Always first, every run. `RUN=captures/$(date +%y%m%d-%H%M)-<scenario-slug>`

```sh
mkdir -p "$RUN"
for ep in system-rules workforce-boundaries route-efficiency service-commitment; do
  gd "${API_BASE}routing/${ep}"
done | jq -s '.' > "$RUN/config.json"
gd "${API_BASE}routing/mantis/custom-rules" >> "$RUN/config.json"
```

Record which fields carry `status: 1`. A rule at `status: 0` is not asserted.

## Step 3 — determinism probe (before any scenario)

Run the identical optimize twice, back to back, no config change in between:

```sh
gd -X PUT "${API_BASE}routing/mantis/manual/optimize" -d @request.json > run-a.ndjson
gd -X PUT "${API_BASE}routing/mantis/manual/optimize" -d @request.json > run-b.ndjson
```

Compare the `jobs` chunks with `scope: "optimized"` only — ignore `tracking`/`progress`,
which legitimately differ.

If placements differ, **stop the corpus run**. A non-deterministic engine makes every
single-run verdict provisional, and that fact outranks any individual scenario result.
Report it before continuing.

## Step 4 — baseline: all rules OFF

The control case. Turn every System rule to `status: 0`, no custom rules active, run.
Nothing should be overridden. Any anomaly here is an engine bug, not a rule bug, and it
contaminates every scenario that follows — so it must be clean before proceeding.

## Step 5 — single-rule scenarios

```sh
awk -F',' '$3=="1 field" || $3=="1 action"' data/module-rules-testcases.csv
```

Per scenario: PUT the one rule ON → optimize → capture → read the feeds → judge.

```sh
gd -X PUT "${API_BASE}routing/mantis/manual/optimize" -d @"$RUN/request.json" > "$RUN/optimize.ndjson"

OPT_ID=$(grep -E '"(done|completed)"' "$RUN/optimize.ndjson" | tail -1 | jq -r '.optimization_id')

gd "${API_BASE}routing/mantis/feeds/errors?start=$START&end=$END&routing_type=manual" > "$RUN/errors.json"
gd "${API_BASE}routing/mantis/feeds/history/$OPT_ID/logs"                             > "$RUN/logs.json"
```

Write `$RUN/result.md`:
`scenario id · rules enabled · expected (corpus) · observed · PASS | FAIL | OPEN QUESTION | OBSERVED`
plus the branch id, the job-id range touched, and the quoted response fragment as evidence.

## Step 6 — edge cases

From `test-matrix.md` → "Edge cases worth running first". Highest signal per run:
impossible windows (expect 0 jobs, cleanly explained), boundary equality (6PM == 6PM →
allowed), cascading hard rules (drive buffer pushing past Max Last Appt).

## Step 7 — hard-vs-soft probes

Run the probe in `api-verification.md` → "Resolving hard-vs-soft empirically" for
Max Jobs per day and each of Q1–Q8. Verdict **OBSERVED**, not PASS.

## Between scenarios

- preview-only: nothing to undo, just change the config and re-run
- accept-then-undo: `gd -X PUT "${API_BASE}routing/mantis/feeds/history/$OPT_ID/undo"`,
  then re-read the jobs and confirm the prior state is back **before** the next scenario.
  An unverified undo pollutes every run after it.

## Sandbox (autopilot) scenarios

Same procedure, different sources: jobs from `routing/mantis/autopilot/jobs`, map from
`routing/mantis/autopilot/routes` (needs the `optimization_id` from the jobs `completed`
chunk), feeds filtered `routing_type=autopilot`.

Autopilot cannot be triggered on demand, so these are bounded by the run schedule
(default daily 00:00). Do not design a sandbox scenario that assumes an on-demand run.

## Session output

One `result.md` per run directory, plus a single summary table across the session:
scenario · verdict · capture path. Raw captures stay on disk — they are what makes a
verdict re-judgeable when the assertions change.
