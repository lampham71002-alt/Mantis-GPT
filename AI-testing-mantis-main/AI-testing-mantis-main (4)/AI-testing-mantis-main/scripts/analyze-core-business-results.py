#!/usr/bin/env python3
import argparse
import json
import pathlib
import statistics
from collections import Counter, defaultdict


def load_results(paths):
    rows = []
    for path in paths:
        p = pathlib.Path(path)
        if p.is_dir():
            files = list(p.glob('results.jsonl'))
        else:
            files = [p]
        for f in files:
            for line in f.read_text(errors='ignore').splitlines():
                line=line.strip()
                if not line or not line.startswith('{'):
                    continue
                try: rows.append(json.loads(line))
                except Exception: pass
    return rows


def issue_flags(r):
    flags=[]
    m=r.get('manual_summary') or {}
    apis=r.get('apis') or {}
    jobs_api=apis.get('GET /routing/mantis/autopilot/jobs') or {}
    manual_api=apis.get('PUT /routing/mantis/manual/optimize') or {}
    setup=r.get('setup') or {}
    expected=r.get('expected_source')
    exp_text=json.dumps(expected, ensure_ascii=False).lower() if expected is not None else ''
    name=r.get('name','')

    if setup.get('apply_failed') or setup.get('pre_restore_failed') or setup.get('post_restore_failed'):
        flags.append(('SETUP_FAIL','rule config setup/restore failed'))
    if manual_api.get('parse_errors'):
        flags.append(('MANUAL_PARSE_ERROR','manual optimize has parse errors'))
    if jobs_api.get('parse_errors'):
        flags.append(('SANDBOX_PARSE_ERROR','sandbox jobs has parse errors'))
    if not jobs_api.get('optimization_id'):
        flags.append(('SANDBOX_NO_OPTIMIZATION_ID','sandbox jobs did not return optimization_id'))

    jb=m.get('jobs_before'); jo=m.get('jobs_optimized')
    if jb is not None and jo is not None and jb != jo:
        flags.append(('JOB_COUNT_CHANGED',f'manual jobs before/optimized count differs {jb}->{jo}'))
    if m.get('jobs_moved') == 0 and jb:
        flags.append(('NO_JOB_PLACEMENT_CHANGE','manual optimized jobs have identical schedule/start/end/day'))

    stats_work=m.get('stats_work')
    if isinstance(stats_work,list) and len(stats_work)==2 and stats_work[0] and stats_work[1]==0:
        flags.append(('STATS_WORK_ZERO_AFTER',f'stats work_time after is 0 while {jo} optimized jobs exist'))
    stats_jobs=m.get('stats_jobs_assigned')
    if isinstance(stats_jobs,list) and jo is not None and len(stats_jobs)==2 and stats_jobs[1] != jo:
        flags.append(('STATS_JOBS_MISMATCH',f"stats jobs_assigned after {stats_jobs[1]} != optimized jobs {jo}"))
    drive=m.get('drive_sum'); sdrive=m.get('stats_drive')
    if isinstance(drive,list) and isinstance(sdrive,list) and len(drive)==2 and len(sdrive)==2:
        # drive_sum is minutes from drive chunks; stats_drive is usually minutes too but much larger in current responses.
        if drive[1] and sdrive[1] and abs(float(sdrive[1])-float(drive[1])) > max(60, float(drive[1])*2):
            flags.append(('DRIVE_STATS_DISAGREE',f'drive chunks after {drive[1]} vs stats_drive after {sdrive[1]}'))
    if 'max jobs' in exp_text or 'jobs-per-day' in name:
        max_day=m.get('max_jobs_one_day')
        # For tight filter variant jobs_per_day=5, exceeding 5 is a direct feature bug.
        filt=r.get('filter_variant') or name
        if 'tight-5' in filt and max_day and max_day > 5:
            flags.append(('MAX_JOBS_FILTER_VIOLATED',f'jobs_per_day=5 but max optimized jobs/day={max_day}'))
        if '15' in exp_text and max_day and max_day > 15:
            flags.append(('MAX_JOBS_RULE_VIOLATED',f'expected max 15 jobs/day but max optimized jobs/day={max_day}'))
    if 'drive buffer' in exp_text:
        # Expect drive after to differ when buffer is active; equal or unchanged is suspicious.
        if isinstance(drive,list) and len(drive)==2 and drive[0] == drive[1]:
            flags.append(('DRIVE_BUFFER_NO_EFFECT','drive_buffer scenario did not change drive chunk sum'))
    if 'preferred jobs' in exp_text or 'workload fairness' in exp_text:
        max_day=m.get('max_jobs_one_day')
        if max_day and max_day > 20:
            flags.append(('FAIRNESS_POOR_DISTRIBUTION',f'max jobs on one day remains high={max_day}'))
    return flags


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--out')
    args=ap.parse_args()
    rows=load_results(args.paths)
    flag_counts=Counter(); examples=defaultdict(list)
    api_counts=Counter(); setup_cases=0
    for r in rows:
        for api,n in (r.get('business_api_counts') or {}).items(): api_counts[api]+=n
        if (r.get('setup') or {}).get('touched_settings'): setup_cases += 1
        for code,msg in issue_flags(r):
            flag_counts[code]+=1
            if len(examples[code])<5:
                examples[code].append({'name':r.get('name'), 'message':msg, 'manual_summary':r.get('manual_summary'), 'expected_source':r.get('expected_source'), 'filter_variant':r.get('filter_variant')})
    lines=[]
    lines.append('# Core Mantis Business API Analysis')
    lines.append('')
    lines.append(f'- Cases analyzed: {len(rows)}')
    lines.append(f'- Cases with rule setup: {setup_cases}')
    lines.append('')
    lines.append('## Business API calls counted')
    lines.append('')
    lines.append('| API | Calls |')
    lines.append('|---|---:|')
    for api,n in sorted(api_counts.items()): lines.append(f'| `{api}` | {n} |')
    lines.append('')
    lines.append('## Findings by flag')
    lines.append('')
    lines.append('| Flag | Count | Meaning |')
    lines.append('|---|---:|---|')
    meanings={
        'SETUP_FAIL':'Rule setup/restore failed; scenario cannot judge feature.',
        'SANDBOX_NO_OPTIMIZATION_ID':'Sandbox jobs did not provide optimization_id, limiting route/map follow-up.',
        'NO_JOB_PLACEMENT_CHANGE':'manual/optimize returned optimized jobs with unchanged schedule/start/end/day.',
        'STATS_WORK_ZERO_AFTER':'Stats says optimized work_time is 0 despite optimized jobs existing.',
        'DRIVE_STATS_DISAGREE':'drive_time chunks and stats.drive_time disagree materially.',
        'MAX_JOBS_FILTER_VIOLATED':'Toolbar jobs_per_day filter/rule not respected in optimized placement.',
        'MAX_JOBS_RULE_VIOLATED':'Max Jobs per day rule not respected in optimized placement.',
        'DRIVE_BUFFER_NO_EFFECT':'Drive buffer rule/filter had no observable drive effect.',
        'FAIRNESS_POOR_DISTRIBUTION':'Fairness/preferred jobs scenarios remain poorly distributed.',
    }
    for code,n in flag_counts.most_common(): lines.append(f'| `{code}` | {n} | {meanings.get(code, "")} |')
    lines.append('')
    lines.append('## Example evidence')
    for code,items in examples.items():
        lines.append(f'\n### {code}')
        for it in items:
            ms=it.get('manual_summary') or {}
            lines.append(f"- `{it['name']}` — {it['message']}; jobs {ms.get('jobs_before')}→{ms.get('jobs_optimized')}, moved={ms.get('jobs_moved')}, max_day={ms.get('max_jobs_one_day')}, stats_work={ms.get('stats_work')}, drive={ms.get('drive_sum')}, stats_drive={ms.get('stats_drive')}")
    text='\n'.join(lines)+'\n'
    if args.out:
        pathlib.Path(args.out).write_text(text)
    print(text)

if __name__=='__main__': main()
