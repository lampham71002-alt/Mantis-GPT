# DES-9619 Jira flow logic

Source: Jira story DES-9619 "FE AI Routing" (description + 26 comments, read
2026-09-14), subtasks DES-9620…9627, linked BE DES-9757/DES-9815. This file covers the
product flow, screen logic, metric formulas, and the date gate formula (Routing Rules
semantics come from Sheet C, `routing-rules-logic.md`). **Rule class and expected
rule outcomes come from the sheets** (`mantis-rule-logic.md`, `sheet-case-catalog.md`,
`cases/`); where Jira text conflicts with a sheet rule, the sheet decides the verdict
and the Jira note is reported as context (§Jira vs sheets).

## Modules and API breakdown

| Subtask | Screen | Evidence / API data |
|---|---|---|
| DES-9620 | Dashboard | Metrics, unroutable jobs, history log, technician filter |
| DES-9621 | Routing AI widget | Autopilot state/runtime, cumulative saved drive time/distance/fuel/total |
| DES-9622 | Sandbox | Sandbox jobs, technicians, summary, filter options, find-jobs context |
| DES-9624 | Route Optimizer modal | Filter preview, optimize preview, preview detail per view/mode, route-group selection, accept/validate/result |
| DES-9623/9627 | Activity Feed + details | Activity list, detail modal, job log, rule actions |
| DES-9625 | Chat with Mantis | Conversations, messages, rename/archive/delete, archived, routing command |
| DES-9626 | Mantis Settings | System, Custom, Specific rules |
| — | Applied Rules modal | `GET /api/routing/mantis/job-rules` → `applied-job-rules-api.md` |

## Routing AI widget

- Shows Autopilot ON/OFF, Start Autopilot AI toggle, Launch button.
- Run Time: days + hours counter from Autopilot ON; never resets.
- Saved Drive Time (h) = Σ drive time before optimize − Σ drive time after optimize.
- Saved Distance (mi) = Σ distance before − Σ distance after.
- Saved Fuel (gal) derived from saved distance. Total Saved = fuel $ in preferred currency.
- All counters are cumulative across runs; never reset.

## Autopilot toggle

- ON modal: "Turning on Auto Pilot will automatically apply all suggested changes from
  your Sandbox to your Live Calendar…" with Time/Distance/Fuel/Total savings.
  Buttons: **Apply Now** (enable + apply current Sandbox changes now) / **Apply on
  Schedule** (enable, wait for next scheduled cycle).
- OFF modal: "Mantis will no longer automatically apply routing changes to your Live
  Calendar. You can still view Mantis' routing suggestions in your Sandbox." Confirm /
  Cancel.

## Dashboard

- Filters: All Time / Today / This Week / This Month / This Year tabs, calendar range
  picker, technician multi-select with Select all.
- Time Ratio: Work Time / Drive Time / Downtime.
- Completed Jobs Average: jobs finished per day in range, % growth vs last year.
- Saved Mileage, Saved Drive Time (h), Downtime (h), Delays (count): totals in range,
  each with % growth vs last year.
- Total Revenue chart and Total Saved chart (line), % growth vs last year.
- Jobs cannot be routed: coordinates too far (other state/country) → not forced, kept
  in current schedule; columns Service, Customer, Address, Date/Time, Technician,
  Review.
- History: initiated-from trigger (Job Move, Job Added, Scheduled Auto Pilot, Job Status
  Change), optimized schedule, saved drive time/mileage/fuel, status, Details.
- History → Details: Sandbox Preview and Accept New Route removed; **Undo** button with
  modal "This will move the jobs back to their previous schedule. Jobs already marked
  as Completed, Cancelled, or Terminated cannot be moved. This action cannot be
  undone." Cancel / Confirm.

### Metric definitions

- Downtime = waiting gap between consecutive jobs after travel (job A ends 9:00, drive
  10 min, job B starts 9:30 → travel 10, downtime 20). Start/end location legs excluded.
- Delay = actual technician start − scheduled start (scheduled 7:00, arrives 7:15 →
  15 min); job duration has no bearing.
- Dates without jobs stay visible (not hidden).

## Sandbox

- Purpose: preview Mantis results before turning Autopilot ON. **Every time Sandbox is
  opened, Mantis runs routing with System, Custom, and Specific rules and shows the
  result in Sandbox only** — not the last run, independent of Autopilot ON/OFF, never
  applied to Live.
- Filters: Schedule/Map switcher, date range dropdown, color coding, schedule filter
  (schedules, not technicians — same as old RO), date selector, Route button.
- Frozen window highlighted on affected dates (darker blue than the Today highlight).
- Clicking a job opens **Applied Rules**: job details, applied rules list, Create
  Custom Rule / Create Specific Rule.

## Route Optimizer (Route > Find Jobs, manual routing)

- Same role as the old calendar RO. Asks for a date range; default = Auto-Pilot
  Optimization Window. Shows Mantis-optimized result; user may accept, or change any
  left-panel field → Optimize Route → review → accept.
- Filters (collapsible): Schedules, Jobs Within (calendar), Job Statuses, Include
  Recurring Jobs (default No), Drive Buffer, Jobs Per Day, Optimize To (tooltip),
  Exclude, Optimize Route button. **"Start From" removed** (not valid for multiple
  technicians).
- Route per technician per day: schedule Start Address → optimized jobs → schedule End
  Address; every day starts/ends at the schedule addresses.
- Preview: technician filter (preview filter only), date filter, Agenda / Calendar /
  Map / List views, Selected / Optimized / Compare switcher.
- Date range filter applies to all 4 views; range with no jobs → empty state; dates
  outside the optimized range disabled in the date picker.
- Map: grouped per day per technician, color per technician-day.
- Agenda/List with multiple schedules: stacked vertically per technician per day,
  technician avatar beside the date.
- Selection: **checkbox per job** (not per day); an unchecked job is excluded from Accept
  New Routes and not rerouted. Agenda "Apply changes/Optimize" day checkboxes removed.
- Jobs synopsis (collapsible), before vs after: Time Ratio (work/drive/downtime),
  Distance (mi), Fuel (gal), Jobs assigned, Expected Payments (preferred currency) —
  each with Before, % optimized, Optimized; Total Save; Accept New Routes.
- Views before/optimized: Calendar shows drive time between jobs (even conflicts);
  Map highlights initial and optimized route; List shows day cards side by side;
  Agenda shows hourly jobs side by side.

## Activity Feed

- Filters: Errors / History tabs; mode dropdown All Modes / Autopilot / Manual
  (Copilot removed); date filter at top.
- Done row: mode, job name, time optimized, saved drive time/mileage/fuel, status,
  Details.
- Details: jobs count; header mode/job/time/status; body before and optimized Time
  Ratio, distance, fuel, jobs assigned, expected payment, date range, schedules, **Job
  Log** (jobs affected by the action), Rules list (editable via chatbot rule setter);
  footer Leave Specific Rule, Sandbox Preview.
- Failed row: service, customer, address, date/time, technician, Preview.

## Chat with Mantis

- Accepts routing commands ("Can you route my schedule for next week").
- New Chat, chat search, history kebab Rename / Archive / Delete (same as Kong), Manage
  Archived Chats (unarchive/delete). Template section like Kong AI: open question.

## Settings defaults and routing flow

- Auto-Pilot Run Frequency always ON, default Daily at 12:00 AM.
- Freeze Window always ON, default Until End of Work Day.
- Mantis moves use "Move this Job and all Recurring" by default.

## Date gate

- Worked example (authoritative): Today 13/08, Freeze 1, Horizon 7 → 14/08–19/08;
  13/08 locked; jobs whose BEFORE is on or after 20/08 are not loaded or optimized. So
  the horizon is `[today, today + horizon − 1]` and the open range starts at `today +
  freeze`. The Jira text `optimization_end = start + horizon − 1 day` would give 20/08
  and contradicts the example; the jobs stream matches the example
  (`windows.horizon_start_unix` = today).
- Jira: Restrict Job Movement OFF → any date in the gate except frozen dates; Restrict
  ±N → date movement ≤ N. Sheet C refines this: the gate is the loading scope, and a
  loaded job placed after `optimization_end` is not FAIL by itself
  (`routing-rules-logic.md`).

## Auditable flow assertions

Use when the evidence covers the flow (not only rule placement):

1. Sandbox run leaves Live calendar jobs unchanged (compare live start/schedule).
2. Sandbox result is recomputed per open; do not accept a stale `optimization_id` as
   the new run.
3. In Sandbox/Auto-Pilot, frozen jobs keep date, time, and technician; jobs whose BEFORE is outside the gate
   are not loaded and keep their placement.
4. Each technician-day route begins/ends at that schedule's start/end address; no
   "start from first job" ordering.
5. Accept New Routes moves only checked jobs; unchecked jobs keep original placement.
6. Synopsis/feeds: saved value = before − after for drive time, distance, fuel, total;
   unchanged placement ⇒ zero savings; % optimized = (before − after) / before.
7. Widget counters never decrease between runs (cumulative).
8. Undo restores previous schedule for movable jobs; Completed/Cancelled/Terminated jobs
   are not moved and are reported.
9. Activity Feed mode values are only All / Autopilot / Manual.
10. Downtime excludes start/end legs; Delay uses actual vs scheduled start only.
11. Jobs that cannot be routed stay in current schedule and appear in the Dashboard list
    (flow); the placement verdict still follows the sheet blocked-job rule.
12. Preview date filter and technician filter never change the optimization result,
   only what is shown. Manual selected dates do not use the Auto-Pilot Freeze/Window
   gate; apply `routing-rules-logic.md` §Manual Route Optimizer.

## Jira vs sheets (sheet wins the verdict)

- Max Job Per Day: Jira says soft with spillover; sheet Module references says Hard cap.
- Unassignable jobs: Jira picks later-day spillover beyond Restrict ("option 3");
  sheets expect not assigned / rejected / postponed within hard rules.
- Unrouteable coordinates: Jira keeps schedule with IGNORE; sheet RE edge expects
  unassigned when no tech within Max Travel Distance.
- Optimization Window: Jira reads the gate as the allowed destination range ("any date
  in the gate"); Sheet C `Routing Rules` #4/#16 treat it as loading scope and allow a
  final overflow when Freeze, Restrict, and Keep Period hold.

## Open questions in the thread

- Manual Optimize Route: override System rules vs merge (e.g. Day Exclusion Mon +
  toolbar Sat/Sun; buffer 10 + 5). Sheet C #41 settles only the gate part: manually
  selected dates ignore Auto-Pilot Freeze/Window; Restrict, Keep Period, and Cross-Tech
  still apply.
- Arrival Window Duration Override applies to routed job or original job.
- Customer Scheduling Preferences Soft or Hard (sheet: Soft).
- Service Type mandatory for Technician Skills.
- Chat with Mantis template section.
