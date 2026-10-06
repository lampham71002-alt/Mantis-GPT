---
name: mantis-routing
globs: ["**/modules/mantis/**/*.js", "**/modules/mantis/**/*.jsx", "**/modules/addons/mantisAI/**/*.js", "**/const/api/Mantis.js"]
description: Mantis AI routing rule engine — the 31 System/Custom rule fields, hard-vs-soft semantics, the 27-level priority hierarchy, routing window math (Freeze/Horizon/Restrict), and the 1,455-case QA corpus. Use when working on Mantis route optimization, sandbox, autopilot, system/custom/specific rules, or when verifying that an optimize API response obeys the configured rules.
---

# Mantis Routing Rules Skill

Ground truth for **what Mantis is supposed to do** when it optimizes a route, and
how to prove an API response is correct.

Sources: `DES-9169 mantis-all-rules-combined.xlsx` (rule catalog + 792 module test
cases), `DES-9619 Cross-Module Combos.xlsx` (663 cross-module combos), and the
DES-9619 Jira thread (product answers on window math and unassigned jobs).

## Quick index

| File | Contents |
|------|----------|
| `rules-catalog.md` | All 31 fields/actions: hard/soft, UI control, **API payload key**, default, QA test value, behaviour |
| `priority-hierarchy.md` | The 27-level precedence order + resolved and unresolved conflict pairs |
| `test-matrix.md` | Corpus shape (792 + 663), edge cases verbatim, known errata in the sheets |
| `api-verification.md` | Endpoints (rules · optimize · **feeds/explainability**), the three-source verification procedure, capture convention, assertion checklist |
| `runbook.md` | Step-by-step procedure for an actual verification session, with copy-paste curl templates |
| `captures/` | One directory per run — raw config, stream, feeds, verdict. Never committed |
| `data/module-rules-testcases.csv` | 792 rows — `module,id,group,condition,expected,conflict` |
| `data/cross-module-combos.csv` | 663 rows — `id,group,wb,re,sc,cr,expected,conflict` |

## Activation rule

```
IF (
  file_path MATCHES src/app/modules/mantis/**
  OR file_path MATCHES src/app/modules/addons/mantisAI/**
  OR file_path MATCHES src/app/const/api/Mantis.js
  OR task CONTAINS mantis|autopilot|sandbox|route optimize|routing rules
                  |system rules|custom rules|specific rules|workforce boundaries
                  |route efficiency|service commitments
)
THEN read: rules-catalog.md, priority-hierarchy.md
AND IF task is about testing/verifying API output THEN also read: api-verification.md, test-matrix.md
```

## The four rule modules

| Code | Module | API key | Fields | Endpoint |
|------|--------|---------|--------|----------|
| WB | Workforce Boundaries | `workforce_boundaries` | 7 | `v1/routing/workforce-boundaries` |
| RE | Route Efficiency | `route_efficiency` | 8 (9 incl. Preferred Tech Soft/Strict as two modes) | `v1/routing/route-efficiency` |
| SC | Service Commitments | `service_commitments` | 5 (6 incl. Region Soft/Strict) | `v1/routing/service-commitment` |
| CR | Custom Rules | AI-authored rule DSL | 11 actions | `v1/routing/mantis/custom-rules` |

A fifth group, **Routing Rules** (`routing_rules`, `v1/routing/system-rules`), is not
part of the 31 but controls *which jobs enter optimization at all* — Freeze Window,
Optimization Horizon, Restrict Job Movement. See "Routing window math" below.

## Hard vs Soft — the single most important distinction

- **Hard rule** = a constraint. Violating it is a **bug**. If no solution satisfies it,
  the job must not be placed in violation.
- **Soft rule** = an objective. Missing it is **not** a bug. Only assert direction
  (result should be no worse than the baseline), never an exact value.

Never write a test that fails a soft rule. Never let a response pass that breaks a hard one.

## Routing window math (confirmed by product, DES-9619 comments 15/16/18)

```
optimization_start = today + freeze_window_days      (freeze days are LOCKED, untouched)
optimization_end   = optimization_start + optimization_horizon
Jobs outside [start, end] are neither loaded nor optimized.
```

Worked example — today 13/08, Freeze 1 day, Horizon 7 days → range **14/08–19/08**;
jobs on 13/08 are frozen, jobs from 20/08 on are invisible to the optimizer.

- **Toolbar filters are additive, not overrides** (confirmed by product): they narrow the
  job set; the System/Custom rules still apply in full on top. For `jobs_per_day` and
  `drive_buffer` the binding value is the **tighter** of toolbar vs system rule.
- **Restrict Job Movement OFF** = no restriction. A job may move to **any** date in the
  optimization range, not just its original day.
- **Max Jobs per day is soft** (product overruled the sheet): try to honour the cap;
  if it cannot be met, still schedule the job rather than leaving it unassigned.
- **Unassigned jobs → Solution #3 (spillover)**: push the job to a later day, even beyond
  the `Restrict` setting. Do **not** keep it at its original overlapping time, and do
  **not** just badge it "unroutable".
- **Un-routable by geography** (lat/long in another state/country): flag as *cannot be
  routed*, keep the current schedule, and use **IGNORE** semantics — not *route around*.

## Two run types

**Sandbox** shows the result of an **autopilot** run the AI already performed.
**Route Optimizer modal** streams a **manual** preview that is not applied until
`manual/accept`. They are separate runs with separate evidence — always pass
`routing_type: autopilot | manual` when reading the feeds, or the two contaminate
each other.

## Placement is not proof — read the feeds

The optimize stream says *where* a job landed. It cannot say *why*, and a job that is
simply missing from the optimized scope looks identical whether the engine rejected it
for the right reason, the wrong reason, or lost it.

The **why** lives in the feeds, both filterable by `routing_type`:

- `routing/mantis/feeds/errors` — jobs that could not be routed, each with `reasons[]`
- `routing/mantis/feeds/history/:id/logs` — per-job `{ from, to, reasons[] }`

Verify against all three sources. `reasons[]` is also what settles the rules the sheets
left ambiguous (Max Jobs hard-or-soft, and most of Q1–Q11) without waiting for product —
see "Resolving hard-vs-soft empirically" in `api-verification.md`.

## When verifying an optimize response

1. Read the active config first (`GET` the four rule endpoints) — never assume defaults.
2. Classify every enabled rule hard vs soft (`rules-catalog.md`).
3. Assert hard rules as invariants over the response jobs; assert soft rules as
   before/after direction only.
4. Cross-check the feeds: every expected-unassigned job present in `feeds/errors` with the
   expected rule in `reasons[]`; every moved job present in the history log. Right outcome
   with the wrong reason is a **FAIL**; a job gone with no feed row is a **FAIL**.
5. On any pair of rules in tension, resolve with `priority-hierarchy.md` — check the winner
   against `reasons[]` rather than inferring it from placement.
6. Report an unresolved-by-spec conflict as **OPEN QUESTION**; report an empirically
   derived answer as **OBSERVED** — it describes the build, not the contract.
7. Capture every run to `captures/` before judging it, and run the same scenario twice
   before trusting any verdict — a non-deterministic engine invalidates single runs.

Full procedure, capture layout and assertion table in `api-verification.md`;
session steps and curl templates in `runbook.md`.
