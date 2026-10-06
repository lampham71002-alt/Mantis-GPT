# Corrected CSV Raw API Analysis

Generated: `2026-08-23T09:08:35`

## Suite result

| Metric | Count |
|---|---:|
| c* matrix rows | 60 |
| successful captures | 60 |
| errors | 0 |
| setup read-back OK | 60 |
| setup read-back failed | 0 |
| job placement changed | 0 |
| drive-time changed | 60 |
| route changed | 60 |
| stats jobs_assigned mismatch | 0 |
| stats drive_time mismatch | 60 |
| stats work_time mismatch | 60 |

## Verdict counts

| Verdict | Count |
|---|---:|
| `REACHES_ENGINE` | 60 |

## Module breakdown

| Module | Verdict | Count |
|---|---|---:|
| Route Efficiency | `REACHES_ENGINE` | 20 |
| Service Commitments | `REACHES_ENGINE` | 14 |
| Workforce Boundaries | `REACHES_ENGINE` | 24 |
| control | `REACHES_ENGINE` | 2 |

## Important interpretation

Setup read-back is valid for all corrected c* cases: every intended config key written by the scenario is present with the same value in `config-applied.json` after API read-back.

The raw optimizer streams still do **not** prove placement changes: `jobs.before` and `jobs.optimized` contain the same job ids and the same job-level date/start/end/schedule/length in all 60 captures. Some rules reach the engine through `drive_time`, `route`, and total stats deltas; those are marked `REACHES_ENGINE`, not full `PASS`, because placement/explainability proof is absent.

## Per-case summary

| Case | Module | Verdict | Setup | Jobs b→o | Job changes | Drive b→o | Δdrive | Route changes | Capture |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| `c000-control-future-csv` | control | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175224-c000-control-future-csv` |
| `c001-control-current-csv` | control | `REACHES_ENGINE` | OK | 83→83 | 0 (+0/-0) | 1199.1→1172.3 | -26.8 | 1 | `260822-175325-c001-control-current-csv` |
| `c002-workforce-boundaries-1-default-service-hours-8-30am-6-` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175344-c002-workforce-boundaries-1-default-service-hours-8-30am-6-` |
| `c003-workforce-boundaries-2-max-jobs-per-day-15` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175447-c003-workforce-boundaries-2-max-jobs-per-day-15` |
| `c004-workforce-boundaries-3-preferred-jobs-per-day-10` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175528-c004-workforce-boundaries-3-preferred-jobs-per-day-10` |
| `c005-workforce-boundaries-4-pre-post-shift-travel-30-min` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175632-c005-workforce-boundaries-4-pre-post-shift-travel-30-min` |
| `c006-workforce-boundaries-5-max-shift-end-time-6-00pm` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175734-c006-workforce-boundaries-5-max-shift-end-time-6-00pm` |
| `c007-workforce-boundaries-6-workload-fairness-on` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175839-c007-workforce-boundaries-6-workload-fairness-on` |
| `c008-workforce-boundaries-8-default-service-hours-8-30am-6p` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-175941-c008-workforce-boundaries-8-default-service-hours-8-30am-6p` |
| `c009-workforce-boundaries-9-default-service-hours-8-30am-6p` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180028-c009-workforce-boundaries-9-default-service-hours-8-30am-6p` |
| `c010-workforce-boundaries-10-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180132-c010-workforce-boundaries-10-default-service-hours-8-30am-6` |
| `c011-workforce-boundaries-11-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180235-c011-workforce-boundaries-11-default-service-hours-8-30am-6` |
| `c012-workforce-boundaries-12-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180338-c012-workforce-boundaries-12-default-service-hours-8-30am-6` |
| `c013-workforce-boundaries-14-max-jobs-per-day-15-preferred-` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180442-c013-workforce-boundaries-14-max-jobs-per-day-15-preferred-` |
| `c014-workforce-boundaries-15-max-jobs-per-day-15-pre-post-s` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180523-c014-workforce-boundaries-15-max-jobs-per-day-15-pre-post-s` |
| `c015-workforce-boundaries-16-max-jobs-per-day-15-max-shift-` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180604-c015-workforce-boundaries-16-max-jobs-per-day-15-max-shift-` |
| `c016-workforce-boundaries-17-max-jobs-per-day-15-workload-f` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180648-c016-workforce-boundaries-17-max-jobs-per-day-15-workload-f` |
| `c017-workforce-boundaries-19-preferred-jobs-per-day-10-pre-` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180729-c017-workforce-boundaries-19-preferred-jobs-per-day-10-pre-` |
| `c018-workforce-boundaries-20-preferred-jobs-per-day-10-max-` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180832-c018-workforce-boundaries-20-preferred-jobs-per-day-10-max-` |
| `c019-workforce-boundaries-21-preferred-jobs-per-day-10-work` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-180935-c019-workforce-boundaries-21-preferred-jobs-per-day-10-work` |
| `c020-workforce-boundaries-23-pre-post-shift-travel-30min-ma` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181037-c020-workforce-boundaries-23-pre-post-shift-travel-30min-ma` |
| `c021-workforce-boundaries-24-pre-post-shift-travel-30min-wo` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181143-c021-workforce-boundaries-24-pre-post-shift-travel-30min-wo` |
| `c022-workforce-boundaries-26-max-shift-end-time-6pm-workloa` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181246-c022-workforce-boundaries-26-max-shift-end-time-6pm-workloa` |
| `c023-workforce-boundaries-29-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181350-c023-workforce-boundaries-29-default-service-hours-8-30am-6` |
| `c024-workforce-boundaries-30-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181431-c024-workforce-boundaries-30-default-service-hours-8-30am-6` |
| `c025-workforce-boundaries-31-default-service-hours-8-30am-6` | Workforce Boundaries | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181512-c025-workforce-boundaries-31-default-service-hours-8-30am-6` |
| `c026-route-efficiency-3-max-travel-distance-10mi` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181553-c026-route-efficiency-3-max-travel-distance-10mi` |
| `c027-route-efficiency-4-max-shift-travel-120min` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181623-c027-route-efficiency-4-max-shift-travel-120min` |
| `c028-route-efficiency-8-skill-matching-on` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181724-c028-route-efficiency-8-skill-matching-on` |
| `c029-route-efficiency-10-min-travel-time-5min-max-travel-di` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181826-c029-route-efficiency-10-min-travel-time-5min-max-travel-di` |
| `c030-route-efficiency-11-min-travel-time-5min-max-shift-tra` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-181859-c030-route-efficiency-11-min-travel-time-5min-max-shift-tra` |
| `c031-route-efficiency-15-min-travel-time-5min-skill-matchin` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182002-c031-route-efficiency-15-min-travel-time-5min-skill-matchin` |
| `c032-route-efficiency-16-min-travel-distance-0-5mi-max-trav` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182104-c032-route-efficiency-16-min-travel-distance-0-5mi-max-trav` |
| `c033-route-efficiency-17-min-travel-distance-0-5mi-max-shif` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182133-c033-route-efficiency-17-min-travel-distance-0-5mi-max-shif` |
| `c034-route-efficiency-21-min-travel-distance-0-5mi-skill-ma` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182235-c034-route-efficiency-21-min-travel-distance-0-5mi-skill-ma` |
| `c035-route-efficiency-22-max-travel-distance-10mi-max-shift` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182336-c035-route-efficiency-22-max-travel-distance-10mi-max-shift` |
| `c036-route-efficiency-23-max-travel-distance-10mi-ignore-re` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182407-c036-route-efficiency-23-max-travel-distance-10mi-ignore-re` |
| `c037-route-efficiency-24-max-travel-distance-10mi-route-aro` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182439-c037-route-efficiency-24-max-travel-distance-10mi-route-aro` |
| `c038-route-efficiency-25-max-travel-distance-10mi-preferred` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182509-c038-route-efficiency-25-max-travel-distance-10mi-preferred` |
| `c039-route-efficiency-26-max-travel-distance-10mi-skill-mat` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182542-c039-route-efficiency-26-max-travel-distance-10mi-skill-mat` |
| `c040-route-efficiency-27-max-shift-travel-120min-ignore-rer` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182612-c040-route-efficiency-27-max-shift-travel-120min-ignore-rer` |
| `c041-route-efficiency-28-max-shift-travel-120min-route-arou` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182715-c041-route-efficiency-28-max-shift-travel-120min-route-arou` |
| `c042-route-efficiency-29-max-shift-travel-120min-preferred-` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182817-c042-route-efficiency-29-max-shift-travel-120min-preferred-` |
| `c043-route-efficiency-30-max-shift-travel-120min-skill-matc` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-182920-c043-route-efficiency-30-max-shift-travel-120min-skill-matc` |
| `c044-route-efficiency-33-ignore-reroute-on-skill-matching-o` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183022-c044-route-efficiency-33-ignore-reroute-on-skill-matching-o` |
| `c045-route-efficiency-35-route-around-on-skill-matching-on` | Route Efficiency | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183125-c045-route-efficiency-35-route-around-on-skill-matching-on` |
| `c046-service-commitments-2-arrival-window-duration-override` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183228-c046-service-commitments-2-arrival-window-duration-override` |
| `c047-service-commitments-3-region-enforcement-strict` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183303-c047-service-commitments-3-region-enforcement-strict` |
| `c048-service-commitments-4-customer-scheduling-preferences-` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183411-c048-service-commitments-4-customer-scheduling-preferences-` |
| `c049-service-commitments-5-add-drive-buffer-time-10-min` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→4375.1 | 576.6 | 6 | `260822-183515-c049-service-commitments-5-add-drive-buffer-time-10-min` |
| `c050-service-commitments-6-max-last-appointment-departure-t` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183616-c050-service-commitments-6-max-last-appointment-departure-t` |
| `c051-service-commitments-7-max-last-appointment-departure-t` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183653-c051-service-commitments-7-max-last-appointment-departure-t` |
| `c052-service-commitments-8-max-last-appointment-departure-t` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-183756-c052-service-commitments-8-max-last-appointment-departure-t` |
| `c053-service-commitments-9-max-last-appointment-departure-t` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→4375.1 | 576.6 | 6 | `260822-183859-c053-service-commitments-9-max-last-appointment-departure-t` |
| `c054-service-commitments-10-arrival-window-duration-overrid` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-184000-c054-service-commitments-10-arrival-window-duration-overrid` |
| `c055-service-commitments-11-arrival-window-duration-overrid` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-184033-c055-service-commitments-11-arrival-window-duration-overrid` |
| `c056-service-commitments-12-arrival-window-duration-overrid` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→4375.1 | 576.6 | 6 | `260822-184107-c056-service-commitments-12-arrival-window-duration-overrid` |
| `c057-service-commitments-13-region-enforcement-strict-custo` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→3876.4 | 77.9 | 6 | `260822-184143-c057-service-commitments-13-region-enforcement-strict-custo` |
| `c058-service-commitments-14-region-enforcement-strict-add-d` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→4375.1 | 576.6 | 6 | `260822-184245-c058-service-commitments-14-region-enforcement-strict-add-d` |
| `c059-service-commitments-15-customer-scheduling-preferences` | Service Commitments | `REACHES_ENGINE` | OK | 212→212 | 0 (+0/-0) | 3798.5→4375.1 | 576.6 | 6 | `260822-184348-c059-service-commitments-15-customer-scheduling-preferences` |

## Files

- JSON: `reports/corrected-csv-raw-analysis.json`
- Markdown: `reports/corrected-csv-raw-analysis.md`
