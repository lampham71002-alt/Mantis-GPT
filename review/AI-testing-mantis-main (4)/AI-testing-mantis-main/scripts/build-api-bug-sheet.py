#!/usr/bin/env python3
import csv
import json
import pathlib
import re
from collections import Counter, defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
CAPTURES = ROOT / 'captures'
REPORTS = ROOT / 'reports'
REPORTS.mkdir(exist_ok=True)
OUT_CSV = REPORTS / 'api-payload-bug-sheet-live.csv'
OUT_MD = REPORTS / 'api-payload-bug-sheet-live.md'


def parse_ndjson(path):
    chunks=[]
    if not path.exists(): return chunks
    for line in path.read_text(errors='ignore').splitlines():
        line=line.strip()
        if not line: continue
        try: chunks.append(json.loads(line))
        except Exception: pass
    return chunks


def jobs_by_id(chunks, scope):
    out={}
    for c in chunks:
        if c.get('type')=='jobs' and c.get('scope')==scope:
            for j in c.get('data') or []:
                jid=str((j.get('job') or {}).get('id'))
                ev=j.get('event') or {}; sch=j.get('schedule') or {}
                out[jid]={
                    'start':ev.get('start'), 'end':ev.get('end'), 'length':ev.get('length'),
                    'schedule_id':str(sch.get('id')), 'schedule_name':sch.get('name'),
                    'day':j.get('date_label'), 'status':(j.get('job') or {}).get('status'),
                    'locked':ev.get('locked'),
                }
    return out


def events_by_id(chunks):
    # autopilot/jobs uses events chunks with items/data depending on BE variant
    out={}
    for c in chunks:
        if c.get('type') not in ('events','jobs'): continue
        rows=[]
        if isinstance(c.get('items'), list): rows=c['items']
        elif isinstance(c.get('data'), list): rows=c['data']
        for j in rows:
            job=j.get('job') or j
            ev=j.get('event') or j
            sch=j.get('schedule') or {}
            jid=str(job.get('id') or j.get('id'))
            if jid and jid!='None':
                out[jid]={
                    'start':ev.get('start'), 'end':ev.get('end'), 'length':ev.get('length'),
                    'schedule_id':str(sch.get('id') or j.get('schedule_id')), 'day':j.get('date_label') or ev.get('date_label'),
                }
    return out


def segments(chunks, kind, scope):
    out=[]
    for c in chunks:
        if c.get('type')==kind and c.get('scope')==scope and isinstance(c.get('data'), list):
            out.extend(c['data'])
    return out


def stats_total(chunks):
    for c in chunks:
        if c.get('type')=='stats' and c.get('scope')=='total': return c.get('data') or {}
    return {}


def metric(st,key):
    m=st.get(key) or {}
    return [(m.get('before') or {}).get('value'), (m.get('after') or {}).get('value')]


def summarize_manual(chunks):
    before=jobs_by_id(chunks,'before'); opt=jobs_by_id(chunks,'optimized')
    moved=[jid for jid in before if jid in opt and before[jid]!=opt[jid]]
    added=[jid for jid in opt if jid not in before]
    missing=[jid for jid in before if jid not in opt]
    db=segments(chunks,'drive_time','before'); do=segments(chunks,'drive_time','optimized')
    st=stats_total(chunks)
    per_day=Counter(j.get('day') for j in opt.values())
    return {
        'jobs_before':len(before), 'jobs_optimized':len(opt), 'jobs_moved':len(moved),
        'jobs_added':len(added), 'jobs_missing':len(missing),
        'moved_sample':','.join(moved[:5]), 'added_sample':','.join(added[:5]), 'missing_sample':','.join(missing[:5]),
        'drive_before':round(sum(float(s.get('value') or 0) for s in db),1),
        'drive_after':round(sum(float(s.get('value') or 0) for s in do),1),
        'drive_segments_before':len(db), 'drive_segments_after':len(do),
        'stats_work_before':((st.get('time_ratio') or {}).get('work_time') or {}).get('before',{}).get('value'),
        'stats_work_after':((st.get('time_ratio') or {}).get('work_time') or {}).get('after',{}).get('value'),
        'stats_drive_before':metric(st,'drive_time')[0], 'stats_drive_after':metric(st,'drive_time')[1],
        'stats_distance_before':metric(st,'distance')[0], 'stats_distance_after':metric(st,'distance')[1],
        'stats_jobs_before':metric(st,'jobs_assigned')[0], 'stats_jobs_after':metric(st,'jobs_assigned')[1],
        'max_jobs_one_day':max(per_day.values()) if per_day else 0,
        'days':len(per_day),
        'optimization_id': next((c.get('optimization_id') for c in chunks if c.get('optimization_id')), None),
    }


def summarize_sandbox(chunks):
    events=events_by_id(chunks)
    opt_id=None
    types=Counter()
    for c in chunks:
        types[f"{c.get('type')}:{c.get('scope')}"]+=1
        opt_id=opt_id or c.get('optimization_id') or ((c.get('data') or {}).get('optimization_id') if isinstance(c.get('data'),dict) else None)
    per_day=Counter(v.get('day') for v in events.values() if v.get('day'))
    return {'sandbox_jobs':len(events), 'sandbox_max_jobs_one_day':max(per_day.values()) if per_day else None, 'sandbox_days':len(per_day), 'sandbox_optimization_id':opt_id, 'sandbox_chunk_types':dict(types)}


def compact_payload(payload):
    if payload is None: return ''
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',',':'))[:1200]


def rule_text(scenario):
    exp=scenario.get('expected_source')
    if isinstance(exp,dict):
        return ' | '.join(str(exp.get(k,'')) for k in ['module','group','condition','expected','conflict'] if exp.get(k))
    return str(exp or scenario.get('description') or '')


def detect_bugs(name, api, payload, scenario, manual=None, sandbox=None):
    bugs=[]; sev=[]
    txt=(name+' '+rule_text(scenario)+' '+str(scenario.get('filter_variant',''))).lower()
    if api=='PUT /routing/mantis/manual/optimize' and manual:
        jo=manual['jobs_optimized']; jb=manual['jobs_before']; moved=manual['jobs_moved']
        if jo and moved==0:
            bugs.append('Optimized placement unchanged: jobs_optimized exists but no job changed schedule/start/end/day') ; sev.append('HIGH')
        if manual.get('stats_work_after')==0 and jo:
            bugs.append(f"stats.time_ratio.work_time.after=0 while optimized jobs={jo}"); sev.append('HIGH')
        if manual.get('stats_jobs_after') is not None and jo is not None and manual.get('stats_jobs_after')!=jo:
            bugs.append(f"stats.jobs_assigned.after={manual.get('stats_jobs_after')} != optimized jobs={jo}"); sev.append('HIGH')
        if manual.get('stats_drive_after') and manual.get('drive_after') and abs(float(manual.get('stats_drive_after'))-float(manual.get('drive_after')))>max(60,float(manual.get('drive_after'))*2):
            bugs.append(f"stats.drive_time.after={manual.get('stats_drive_after')} disagrees with drive_time chunk sum={manual.get('drive_after')}"); sev.append('MED')
        if payload:
            if payload.get('jobs_per_day')==5 and manual['max_jobs_one_day'] and manual['max_jobs_one_day']>5:
                bugs.append(f"Payload jobs_per_day=5 ignored: max optimized jobs/day={manual['max_jobs_one_day']}"); sev.append('CRITICAL')
            if payload.get('jobs_per_day')==15 and manual['max_jobs_one_day'] and manual['max_jobs_one_day']>15:
                bugs.append(f"Payload jobs_per_day=15 ignored: max optimized jobs/day={manual['max_jobs_one_day']}"); sev.append('HIGH')
            if payload.get('inc','__MISSING__')=='' and jb==212:
                bugs.append('Payload inc="" appears not to reduce recurring jobs; before count still 212'); sev.append('MED')
            if payload.get('exclude') and manual.get('jobs_missing')==0 and manual.get('jobs_before') in (83,212):
                bugs.append(f"Payload exclude={payload.get('exclude')} did not produce explicit missing/dropped jobs in before→optimized comparison"); sev.append('LOW')
        if 'max jobs per day' in txt and manual.get('max_jobs_one_day') and manual.get('max_jobs_one_day')>15:
            bugs.append(f"Rule Max Jobs per day expected 15 but max optimized jobs/day={manual.get('max_jobs_one_day')}"); sev.append('CRITICAL')
        if 'preferred jobs' in txt and manual.get('max_jobs_one_day') and manual.get('max_jobs_one_day')>20:
            bugs.append(f"Preferred Jobs/Fairness poor distribution: max optimized jobs/day={manual.get('max_jobs_one_day')}"); sev.append('MED')
        if 'workload fairness' in txt and manual.get('max_jobs_one_day') and manual.get('max_jobs_one_day')>20:
            bugs.append(f"Workload Fairness did not balance jobs: max optimized jobs/day={manual.get('max_jobs_one_day')}"); sev.append('MED')
        if 'drive buffer' in txt and manual.get('drive_before')==manual.get('drive_after'):
            bugs.append('Drive Buffer rule/filter had no observable drive_time chunk effect'); sev.append('MED')
    if api=='GET /routing/mantis/autopilot/jobs' and sandbox:
        if not sandbox.get('sandbox_optimization_id'):
            bugs.append('Sandbox jobs response missing optimization_id'); sev.append('MED')
        sj=sandbox.get('sandbox_jobs')
        maxd=sandbox.get('sandbox_max_jobs_one_day')
        if sj==0:
            bugs.append('Sandbox jobs parsed 0 job events'); sev.append('HIGH')
        if payload:
            if payload.get('jobs_per_day')==5 and maxd and maxd>5:
                bugs.append(f'Sandbox jobs ignores payload jobs_per_day=5: max jobs/day={maxd}'); sev.append('CRITICAL')
            if payload.get('jobs_per_day')==15 and maxd and maxd>15:
                bugs.append(f'Sandbox jobs ignores payload jobs_per_day=15: max jobs/day={maxd}'); sev.append('HIGH')
        if 'max jobs per day' in txt and maxd and maxd>15:
            bugs.append(f'Sandbox jobs violates Max Jobs per day 15: max jobs/day={maxd}'); sev.append('CRITICAL')
        if ('preferred jobs' in txt or 'workload fairness' in txt) and maxd and maxd>20:
            bugs.append(f'Sandbox jobs poor distribution for fairness/preferred jobs: max jobs/day={maxd}'); sev.append('MED')
    return ('; '.join(bugs), max(sev, key=lambda s:{'LOW':1,'MED':2,'HIGH':3,'CRITICAL':4}.get(s,0)) if sev else 'OK')


def iter_core_results():
    # Current rule/filter business runs.
    patterns = [
        '*smoke-no-routes*',
        '*core-2api-rule-filter-no-routes*',
        '*more-sandbox-manual*',
    ]
    seen = set()
    folders = []
    for pattern in patterns:
        for folder in sorted(CAPTURES.glob(pattern)):
            if folder in seen:
                continue
            seen.add(folder)
            folders.append(folder)
    for folder in folders:
        rp=folder/'results.jsonl'
        if not rp.exists(): continue
        for line in rp.read_text(errors='ignore').splitlines():
            if line.strip().startswith('{'):
                yield folder, json.loads(line)


def rows_from_core():
    out=[]
    for folder,res in iter_core_results():
        name=res['name']; scenario=res.get('expected_source')
        # full scenario is in child/scenario.json
        child=next(folder.glob(name[:120]+'*'), None)
        if not child:
            # exact directories are slug-limited; search by prefix token
            token=name[:80]
            matches=list(folder.glob(token+'*'))
            child=matches[0] if matches else None
        sc={}
        if child and (child/'scenario.json').exists():
            try: sc=json.loads((child/'scenario.json').read_text())
            except Exception: sc={}
        if not sc:
            sc={'expected_source':scenario, 'filters':None, 'config':None, 'name':name}
        payload=sc.get('filters')
        # manual
        manual=res.get('manual_summary')
        if not manual and child and (child/'manual-optimize.ndjson').exists(): manual=summarize_manual(parse_ndjson(child/'manual-optimize.ndjson'))
        bug,severity=detect_bugs(name,'PUT /routing/mantis/manual/optimize',payload,sc,manual=manual)
        out.append({'scenario':name,'source_capture':folder.name,'api':'PUT /routing/mantis/manual/optimize','method':'PUT','payload':compact_payload(payload),'rule_expected':rule_text(sc),'filter_variant':sc.get('filter_variant',''),'setup_config':compact_payload(sc.get('config')),'key_observed':compact_payload(manual),'severity':severity,'bugs':bug})
        # sandbox jobs
        sj=res.get('apis',{}).get('GET /routing/mantis/autopilot/jobs')
        if child and (child/'sandbox-jobs.ndjson').exists(): sj={**(sj or {}), **summarize_sandbox(parse_ndjson(child/'sandbox-jobs.ndjson'))}
        sp={k:payload.get(k) for k in ['schedule_ids','start','end','statuses','inc','color_id','jobs_per_day','drive_buffer','optimize_to','exclude'] if isinstance(payload,dict) and k in payload}
        sp['agenda']='agendaWeek'
        bug,severity=detect_bugs(name,'GET /routing/mantis/autopilot/jobs',sp,sc,sandbox=sj)
        out.append({'scenario':name,'source_capture':folder.name,'api':'GET /routing/mantis/autopilot/jobs','method':'GET','payload':compact_payload(sp),'rule_expected':rule_text(sc),'filter_variant':sc.get('filter_variant',''),'setup_config':compact_payload(sc.get('config')),'key_observed':compact_payload(sj),'severity':severity,'bugs':bug})
    return out


def matrix_rows(limit_per_prefix=None):
    # Thousands of old manual optimize captures from matrix-results. Include summary-level sheet rows.
    mp=CAPTURES/'matrix-results.json'
    if not mp.exists(): return []
    data=json.loads(mp.read_text())
    scenario_map={}
    for f in (ROOT/'scripts').glob('*.json'):
        try:
            arr=json.loads(f.read_text())
            for sc in arr:
                if isinstance(sc,dict) and sc.get('name'): scenario_map[sc['name']]=sc
        except Exception: pass
    out=[]; counts=Counter()
    for r in data:
        name=r.get('name','')
        m=re.match(r'([a-z]+)\d+', name); pref=m.group(1) if m else '?'
        if limit_per_prefix and counts[pref]>=limit_per_prefix: continue
        counts[pref]+=1
        sc=scenario_map.get(name,{})
        payload=sc.get('filters')
        # r already summary of manual optimize or error
        manual={
            'jobs_before':r.get('jobs_before'), 'jobs_optimized':r.get('jobs_optimized'), 'jobs_moved':r.get('jobs_moved'),
            'jobs_added':None, 'jobs_missing':None, 'drive_before':(r.get('drive_sum') or [None,None])[0], 'drive_after':(r.get('drive_sum') or [None,None])[1],
            'stats_work_before':(r.get('stats_work') or [None,None])[0], 'stats_work_after':(r.get('stats_work') or [None,None])[1],
            'stats_drive_before':(r.get('stats_drive') or [None,None])[0], 'stats_drive_after':(r.get('stats_drive') or [None,None])[1],
            'stats_jobs_after':(r.get('stats_jobs_assigned') or [None,None])[1], 'max_jobs_one_day':r.get('max_jobs_one_day')
        }
        bug,severity=detect_bugs(name,'PUT /routing/mantis/manual/optimize',payload,sc,manual=manual)
        if r.get('error'):
            bug='Setup/config rejected before manual optimize: '+str(r.get('error')); severity='SETUP_FAIL'
        out.append({'scenario':name,'source_capture':r.get('capture','matrix-results.json'),'api':'PUT /routing/mantis/manual/optimize','method':'PUT','payload':compact_payload(payload),'rule_expected':rule_text(sc),'filter_variant':sc.get('filter_variant',''),'setup_config':compact_payload(sc.get('config')),'key_observed':compact_payload(r),'severity':severity,'bugs':bug})
    return out


def main():
    core=rows_from_core()
    matrix=matrix_rows()
    rows=core+matrix
    fields=['scenario','source_capture','api','method','payload','rule_expected','filter_variant','setup_config','key_observed','severity','bugs']
    with OUT_CSV.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
    # Markdown concise bug sheet: only non-OK rows, prioritizing current core APIs then matrix samples.
    bug_rows=[r for r in rows if r['severity'] not in ('OK','') and r['bugs']]
    counts=Counter((r['api'],r['severity']) for r in rows)
    bug_counts=Counter(r['bugs'].split('; ')[0] for r in bug_rows)
    lines=[]
    lines.append('# API Payload → Observed → Bug Sheet (live)')
    lines.append('')
    lines.append(f'- Sheet CSV: `{OUT_CSV}`')
    lines.append(f'- Rows written: {len(rows)}')
    lines.append(f'- Bug rows: {len(bug_rows)}')
    lines.append('')
    lines.append('## API row counts by severity')
    lines.append('| API | Severity | Rows |')
    lines.append('|---|---:|---:|')
    for (api,sev),n in sorted(counts.items()): lines.append(f'| `{api}` | `{sev}` | {n} |')
    lines.append('')
    lines.append('## Top bug signatures')
    lines.append('| Bug signature | Rows |')
    lines.append('|---|---:|')
    for bug,n in bug_counts.most_common(20): lines.append(f'| {bug[:180]} | {n} |')
    lines.append('')
    lines.append('## Concrete current core API bugs (first 40)')
    lines.append('| Scenario | API | Payload focus | Observed | Severity | Bug |')
    lines.append('|---|---|---|---|---|---|')
    shown=0
    for r in bug_rows:
        if 'core-2api' not in r['source_capture'] and 'smoke-no-routes' not in r['source_capture']: continue
        payload=json.loads(r['payload']) if r['payload'] else {}
        focus={k:payload.get(k) for k in ['jobs_per_day','drive_buffer','optimize_to','inc','color_id','exclude','start','end'] if k in payload}
        obs=json.loads(r['key_observed']) if r['key_observed'] else {}
        obs_focus={k:obs.get(k) for k in ['jobs_before','jobs_optimized','jobs_moved','max_jobs_one_day','stats_work_after','drive_after','stats_drive_after','sandbox_jobs','sandbox_optimization_id'] if k in obs}
        lines.append(f"| `{r['scenario']}` | `{r['api']}` | `{compact_payload(focus)}` | `{compact_payload(obs_focus)}` | `{r['severity']}` | {r['bugs'][:300]} |")
        shown+=1
        if shown>=40: break
    OUT_MD.write_text('\n'.join(lines)+'\n')
    print(json.dumps({'csv':str(OUT_CSV),'md':str(OUT_MD),'rows':len(rows),'bug_rows':len(bug_rows),'core_rows':len(core),'matrix_rows':len(matrix)},indent=2))

if __name__=='__main__': main()
