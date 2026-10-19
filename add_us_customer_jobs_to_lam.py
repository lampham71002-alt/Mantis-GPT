import json,pathlib,urllib.request,urllib.parse,urllib.error,copy,datetime,random,concurrent.futures
from zoneinfo import ZoneInfo
R=pathlib.Path(__file__).parent;OUT=R/'lam_us_customer_jobs';OUT.mkdir(exist_ok=True)
HAR=json.load(open(R/'delete.har',encoding='utf-8-sig'))['log']['entries'];src=next(e['request'] for e in HAR if e.get('request',{}).get('method')=='GET' and '/api/' in e['request']['url'])
H={x['name']:x['value'] for x in src['headers'] if x['name'].lower() in ('token','gd-branch-id','platform','authorization','cookie')};H['Content-Type']='application/json';H['Accept']='application/json';API='https://apiv2.gdesk.io/api/'
def api(path,body=None):
 q=urllib.request.Request(API+path,headers=H,method='GET' if body is None else 'POST',data=None if body is None else json.dumps(body).encode())
 try:
  with urllib.request.urlopen(q,timeout=90) as r:d=json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('HTTP '+str(e.code)+' '+e.read().decode(errors='replace')[:700])
 if d.get('success') is not True:raise RuntimeError('API failed '+path+': '+json.dumps(d.get('message'),ensure_ascii=False))
 return d.get('data')
def save(name,x):(OUT/(name+'.json')).write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
def all_customers():
 result=[];off=0;lim=100
 while True:
  q={'active':0,'character':'','deleted':0,'fields':'total,','keyword':'','limit':lim,'offset':off,'order':'customer asc','sort_by':'first_name','status':'0,1','sub_locations':0,'tag':-1,'total_customer':1}
  d=api('customers?'+urllib.parse.urlencode(q))
  if isinstance(d,list):
   result+=d
   if len(d)<lim:return result
  else:
   result+=d.get('data',[])
   if not d.get('show_more'):return result
  off+=lim
def read_customer(cid):
 q={'active':0,'customer_id':cid,'deleted':0,'keyword':'','limit':100,'offset':0,'order':'date desc','status':-1,'total':1,'location_ids':-1,'unit_ids':-1}
 d=api('customers/'+cid+'/jobs?'+urllib.parse.urlencode(q))
 return d if isinstance(d,list) else d.get('data',[])
def details(c):
 cid=str(c['id']);full=(c.get('customer') or {}).get('full_name') or c.get('title') or '';full=str(full).strip()
 jobs=read_customer(cid)
 has_lam=any(any(str(a.get('id'))=='31' or str(a.get('name','')).strip().casefold()=='lam' for a in (j.get('assignees') or [])) for j in jobs)
 if has_lam:return {'id':cid,'name':full,'has_lam':True,'jobs':len(jobs),'locations':[]}
 loc=api('customers/'+cid+'/locations/simplify?'+urllib.parse.urlencode({'customer_id':cid,'inc':'tags,units','order':'service_address'}))
 return {'id':cid,'name':full,'has_lam':False,'jobs':len(jobs),'locations':loc or []}
customers=all_customers()
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:checked=list(ex.map(details,customers))
missing=[c for c in checked if not c['has_lam']]
us_states=set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split())
def us_location(l):
 country=str(l.get('country') or '').strip().casefold()
 if country:return country in ('us','usa','united states','united states of america')
 state=str(l.get('state') or '').strip().upper()
 try:lat=float(l.get('lat'));lon=float(l.get('lng'))
 except (TypeError,ValueError):return False
 in_us=(-179<=lon<=-65 and 17<=lat<=72)
 return state in us_states and in_us
eligible=[];excluded=[]
for c in missing:
 opts=[l for l in c['locations'] if us_location(l)]
 if opts:eligible.append({'id':c['id'],'name':c['name'],'location':opts[0]})
 else:excluded.append({'id':c['id'],'name':c['name'],'locations':[{'address':l.get('address'),'city':l.get('city'),'state':l.get('state'),'country':l.get('country')} for l in c['locations']]})
assert len(missing)==22,('Customer set changed, review before posting',len(missing))
assert len(eligible)==21 and len(excluded)==1,('Unexpected US-location eligibility',len(eligible),excluded)
# Check fresh Lam schedule assignments and place three jobs per weekday with three-hour gaps.
RNG=random.SystemRandom();slots=[];zone=ZoneInfo('America/New_York')
for day in [26,27,28,29,30]:
 for hour in (9,12,15):slots.append(datetime.datetime(2026,10,day,hour,0,tzinfo=zone).astimezone(datetime.timezone.utc))
for day in [2,3]:
 for hour in (9,12,15):slots.append(datetime.datetime(2026,11,day,hour,0,tzinfo=zone).astimezone(datetime.timezone.utc))
assert len(slots)==21
for c in eligible:
 fresh=read_customer(c['id'])
 if any(any(str(a.get('id'))=='31' or str(a.get('name','')).strip().casefold()=='lam' for a in (j.get('assignees') or [])) for j in fresh):raise RuntimeError('A customer got a Lam job during planning: '+c['name'])
services=json.load(open(R/'florida_seed'/'service_templates.json',encoding='utf-8'))
one_time=[s for s in services if s.get('repeat')==0 and not (s.get('recurrence') or {}).get('offset') and str((s.get('recurrence') or {}).get('summary','Once')).lower() in ('once','')]
assert one_time
baseplan=json.load(open(OUT.parent/'lam_schedule_added_jobs'/'plan.json',encoding='utf-8'));template=copy.deepcopy(baseplan['jobs'][0]['payload'])
RNG.shuffle(eligible);plan=[]
for i,(c,when) in enumerate(zip(eligible,slots),1):
 svc=RNG.choice(one_time);minutes=RNG.randint(10,40);end=when+datetime.timedelta(minutes=minutes);body=copy.deepcopy(template)
 body.update(customer_id=c['id'],location_id=str(c['location']['id']),service_id=str(svc['id']),primary_schedule_id='31',schedule_ids=[],date=when.isoformat(timespec='milliseconds').replace('+00:00','Z'),hours=0,minutes=minutes,always_confirmed=svc.get('always_confirmed',0),note='US customer test: one job added to Lam schedule',notify_tech=0,notify_customer={'isNotifyCustomer':False,'template':{}})
 plan.append({'index':i,'customer_id':c['id'],'customer_name':c['name'],'location_id':str(c['location']['id']),'location_address':c['location'].get('address'),'service_id':str(svc['id']),'service_name':svc['name'],'duration_minutes':minutes,'start_utc':when.isoformat(),'end_utc':end.isoformat(),'start_local':when.astimezone(zone).isoformat(),'payload':body})
save('eligibility',{'full_customer_count':len(customers),'missing_lam_count':len(missing),'us_eligible_count':len(eligible),'excluded':excluded,'eligible':[{'id':c['id'],'name':c['name'],'location':{k:c['location'].get(k) for k in ['id','city','state','zip','address']}} for c in eligible],'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
planfile=OUT/'plan.json'
if planfile.exists():plan=json.load(open(planfile,encoding='utf-8'))
else:plan={'schedule_id':'31','schedule_name':'Lam','timezone':'America/New_York','jobs':plan};save('plan',plan)
statefile=OUT/'created.json';state=json.load(open(statefile,encoding='utf-8')) if statefile.exists() else {'jobs':{},'pending':None}
if state.get('pending'):raise RuntimeError('Prior create is uncertain; resolve pending before retry.')
for item in plan['jobs']:
 key=str(item['index'])
 if key not in state['jobs']:
  state['pending']={'index':item['index'],'customer_id':item['customer_id'],'customer_name':item['customer_name']};save('created',state)
  result=api('jobs',item['payload'])
  state['jobs'][key]={'job_id':str(result['id']),'customer_id':item['customer_id'],'customer_name':item['customer_name'],'service_name':item['service_name'],'duration_minutes':item['duration_minutes'],'start_utc':result.get('start'),'verified':False};state['pending']=None;save('created',state)
 rec=state['jobs'][key]
 if not rec['verified']:
  d=api('jobs/'+rec['job_id']+'?fields=name&type=0');e=d['event']
  assert str(d['customer']['id'])==item['customer_id'] and str(d['location']['id'])==item['location_id'] and str(d['job']['service']['id'])==item['service_id']
  assert any(str(s['id'])=='31' for s in d['schedule'])
  assert datetime.datetime.fromisoformat(e['start'])==datetime.datetime.fromisoformat(item['start_utc'])
  assert (datetime.datetime.fromisoformat(e['end'])-datetime.datetime.fromisoformat(e['start'])).total_seconds()==item['duration_minutes']*60
  rec.update(start_utc=e['start'],end_utc=e['end'],event_id=str(e['id']),verified=True);save('created',state)
  print('Created verified '+rec['job_id']+' for '+item['customer_name'],flush=True)
final=[]
for c in eligible:
 js=read_customer(c['id']);matches=[]
 for j in js:
  if any(str(a.get('id'))=='31' or str(a.get('name','')).strip().casefold()=='lam' for a in (j.get('assignees') or [])):matches.append(str(j.get('id')))
 final.append({'customer_id':c['id'],'customer':c['name'],'lam_jobs':matches})
assert all(len(x['lam_jobs'])>=1 for x in final),final
report={'schedule':'Lam','schedule_id':'31','full_customer_count':len(customers),'initially_missing':len(missing),'us_locations':len(eligible),'excluded_non_us':excluded,'created':len(state['jobs']),'verified':sum(bool(x.get('verified')) for x in state['jobs'].values()),'customer_lam_job_ids':final,'jobs':state['jobs'],'completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
save('result',report)
print(json.dumps({'schedule':'Lam (31)','full_customers':len(customers),'initially_missing':len(missing),'us_eligible':len(eligible),'excluded':excluded,'created':report['created'],'verified':report['verified'],'result_file':str(OUT/'result.json')},ensure_ascii=False))
