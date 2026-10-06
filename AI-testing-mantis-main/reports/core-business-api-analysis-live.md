# Core Mantis Business API Analysis

- Cases analyzed: 48
- Cases with rule setup: 44

## Business API calls counted

| API | Calls |
|---|---:|
| `GET /routing/mantis/autopilot/jobs` | 48 |
| `GET /routing/mantis/autopilot/routes` | 0 |
| `PUT /routing/mantis/manual/optimize` | 48 |

## Findings by flag

| Flag | Count | Meaning |
|---|---:|---|
| `NO_JOB_PLACEMENT_CHANGE` | 46 | manual/optimize returned optimized jobs with unchanged schedule/start/end/day. |
| `STATS_WORK_ZERO_AFTER` | 37 | Stats says optimized work_time is 0 despite optimized jobs existing. |
| `DRIVE_STATS_DISAGREE` | 37 | drive_time chunks and stats.drive_time disagree materially. |
| `FAIRNESS_POOR_DISTRIBUTION` | 6 | Fairness/preferred jobs scenarios remain poorly distributed. |
| `MAX_JOBS_FILTER_VIOLATED` | 4 | Toolbar jobs_per_day filter/rule not respected in optimized placement. |
| `MAX_JOBS_RULE_VIOLATED` | 3 | Max Jobs per day rule not respected in optimized placement. |
| `STATS_JOBS_MISMATCH` | 1 |  |

## Example evidence

### NO_JOB_PLACEMENT_CHANGE
- `r000-control-future-all-d000-control-future-csv` — manual optimized jobs have identical schedule/start/end/day; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r001-control-current-exclude-d000-control-future-csv` — manual optimized jobs have identical schedule/start/end/day; jobs 83→83, moved=0, max_day=32, stats_work=[2190, 840], drive=[1199.1, 1172.3], stats_drive=[2986, 2986]
- `r002-control-future-no-recurring-d000-control-future-csv` — manual optimized jobs have identical schedule/start/end/day; jobs 106→106, moved=0, max_day=16, stats_work=[2910, 0], drive=[2285.6, 2285.6], stats_drive=[2984, 2984]
- `r003-control-future-drive-buffer-10-d000-control-future-csv` — manual optimized jobs have identical schedule/start/end/day; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 4375.1], stats_drive=[28599, 32421]
- `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15` — manual optimized jobs have identical schedule/start/end/day; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]

### STATS_WORK_ZERO_AFTER
- `r000-control-future-all-d000-control-future-csv` — stats work_time after is 0 while 212 optimized jobs exist; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r002-control-future-no-recurring-d000-control-future-csv` — stats work_time after is 0 while 106 optimized jobs exist; jobs 106→106, moved=0, max_day=16, stats_work=[2910, 0], drive=[2285.6, 2285.6], stats_drive=[2984, 2984]
- `r003-control-future-drive-buffer-10-d000-control-future-csv` — stats work_time after is 0 while 212 optimized jobs exist; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 4375.1], stats_drive=[28599, 32421]
- `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15` — stats work_time after is 0 while 212 optimized jobs exist; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r006-default-future-d003-workforce-boundaries-2-max-jobs-per-day-15` — stats work_time after is 0 while 212 optimized jobs exist; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]

### DRIVE_STATS_DISAGREE
- `r000-control-future-all-d000-control-future-csv` — drive chunks after 3876.4 vs stats_drive after 30371; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r003-control-future-drive-buffer-10-d000-control-future-csv` — drive chunks after 4375.1 vs stats_drive after 32421; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 4375.1], stats_drive=[28599, 32421]
- `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15` — drive chunks after 3876.4 vs stats_drive after 30371; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r006-default-future-d003-workforce-boundaries-2-max-jobs-per-day-15` — drive chunks after 3876.4 vs stats_drive after 30371; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r007-jobs-per-day-tight-5-d004-workforce-boundaries-3-preferred-jobs-per-da` — drive chunks after 3876.4 vs stats_drive after 30371; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]

### MAX_JOBS_FILTER_VIOLATED
- `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15` — jobs_per_day=5 but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r007-jobs-per-day-tight-5-d004-workforce-boundaries-3-preferred-jobs-per-da` — jobs_per_day=5 but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r010-jobs-per-day-tight-5-d007-workforce-boundaries-6-workload-fairness-on` — jobs_per_day=5 but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r047-jobs-per-day-tight-5-d008-workforce-boundaries-8-default-service-hours` — jobs_per_day=5 but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]

### MAX_JOBS_RULE_VIOLATED
- `r004-jobs-per-day-tight-5-d003-workforce-boundaries-2-max-jobs-per-day-15` — expected max 15 jobs/day but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r006-default-future-d003-workforce-boundaries-2-max-jobs-per-day-15` — expected max 15 jobs/day but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r047-jobs-per-day-tight-5-d008-workforce-boundaries-8-default-service-hours` — expected max 15 jobs/day but max optimized jobs/day=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]

### STATS_JOBS_MISMATCH
- `r005-jobs-per-day-rule-15-d003-workforce-boundaries-2-max-jobs-per-day-15` — stats jobs_assigned after None != optimized jobs 0; jobs 0→0, moved=0, max_day=0, stats_work=[None, None], drive=[0, 0], stats_drive=[None, None]

### FAIRNESS_POOR_DISTRIBUTION
- `r007-jobs-per-day-tight-5-d004-workforce-boundaries-3-preferred-jobs-per-da` — max jobs on one day remains high=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r008-jobs-per-day-rule-15-d004-workforce-boundaries-3-preferred-jobs-per-da` — max jobs on one day remains high=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r009-default-future-d004-workforce-boundaries-3-preferred-jobs-per-day-10` — max jobs on one day remains high=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r010-jobs-per-day-tight-5-d007-workforce-boundaries-6-workload-fairness-on` — max jobs on one day remains high=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
- `r011-jobs-per-day-rule-15-d007-workforce-boundaries-6-workload-fairness-on` — max jobs on one day remains high=36; jobs 212→212, moved=0, max_day=36, stats_work=[5370, 0], drive=[3798.5, 3876.4], stats_drive=[28599, 30371]
