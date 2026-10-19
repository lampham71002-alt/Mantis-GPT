import argparse, copy, datetime as dt, json, pathlib, random, time, urllib.parse, urllib.request, urllib.error

ROOT=pathlib.Path(__file__).parent
OUT=ROOT/'florida_seed'
OUT.mkdir(exist_ok=True)

class ApiRejected(RuntimeError):pass

def request(url, headers=None, body=None, method='GET'):
    raw=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(url,data=raw,headers=headers or {},method=method)
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            result=json.load(response)
    except urllib.error.HTTPError as err:
        message=err.read().decode('utf-8',errors='replace')
        if err.code==422:raise ApiRejected(f'HTTP {err.code}: {message[:1200]}') from None
        raise RuntimeError(f'HTTP {err.code}: {message[:1200]}') from None
    return result

def api_config():
    entries=json.loads((ROOT/'customer.har').read_text(encoding='utf-8-sig'))['log']['entries']
    entry=next(e for e in entries if e['request']['method']=='POST' and urllib.parse.urlsplit(e['request']['url']).path=='/api/customers')
    headers={h['name']:h['value'] for h in entry['request']['headers'] if h['name'].lower() in ('token','gd-branch-id','platform','authorization','content-type','cookie')}
    headers['Content-Type']='application/json'
    return 'https://apiv2.gdesk.io/api/',headers,json.loads(entry['request']['postData']['text'])

def api(path,body=None):
    base,headers,_=api_config()
    result=request(base+path,headers,body,'POST' if body is not None else 'GET')
    if result.get('success') is not True:
        raise RuntimeError('API rejected '+path+': '+json.dumps(result.get('message')))
    return result

def probe():
    result=api('customers/init')
    print(json.dumps({'authenticated':result['success'],'init_available':bool(result.get('data',{}).get('number'))}))

def prepare():
    cities=['Miami','Hollywood','Boca Raton','Deerfield Beach','Fort Lauderdale','West Palm Beach','Jupiter','Stuart','Port St. Lucie','Fort Pierce','Vero Beach','Sebastian','Melbourne','Cocoa','Titusville','Orlando','Kissimmee','Lakeland','Tampa','Clearwater']
    geofile=OUT/'geocoded.json'
    locations=json.loads(geofile.read_text()) if geofile.exists() else []
    for city in cities:
        if any(x['city']==city for x in locations): continue
        url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode({'q':city+', Florida, United States','format':'jsonv2','addressdetails':1,'limit':1,'countrycodes':'us'})
        results=request(url,{'User-Agent':'FloridaRoutingTestSetup/1.0'})
        if not results: raise RuntimeError('No geocode for '+city)
        row=results[0];address=row.get('address',{})
        if address.get('state')!='Florida':raise RuntimeError('Wrong state for '+city)
        locations.append({'city':city,'state':'FL','country':'United States','county':address.get('county',''),'zip':address.get('postcode',''),'lat':float(row['lat']),'lng':float(row['lon']),'formattedAddress':row['display_name'],'street1':city+' (Routing Test Location)','street2':''})
        geofile.write_text(json.dumps(locations,indent=2),encoding='utf-8')
        print('GEOCODED '+city,flush=True)
        time.sleep(1.1)
    tablefile=OUT/'travel_table.json'
    if tablefile.exists():table=json.loads(tablefile.read_text())
    else:
        coords=';'.join(str(x['lng'])+','+str(x['lat']) for x in locations)
        table=request('https://router.project-osrm.org/table/v1/driving/'+coords+'?annotations=duration,distance')
        if table.get('code')!='Ok':raise RuntimeError('Routing table unavailable')
        tablefile.write_text(json.dumps(table),encoding='utf-8')
    rng=random.Random()
    for attempt in range(100000):
        order=[rng.randrange(20)];available=set(range(20))-set(order)
        while available:
            choices=[n for n in available if table['durations'][order[-1]][n] is not None and 900<=table['durations'][order[-1]][n]<=7200]
            if not choices:break
            n=rng.choice(choices);order.append(n);available.remove(n)
        if len(order)==20:break
    else:raise RuntimeError('Cannot find full sequence satisfying drive time')
    plan=[]
    for i,n in enumerate(order):
        row={'index':i+1,'name':f'FL Routing Test {i+1:02d}','location':locations[n],'job_count':rng.randint(1,3),'previous_drive_minutes':None if i==0 else round(table['durations'][order[i-1]][n]/60,1),'previous_drive_km':None if i==0 else round(table['distances'][order[i-1]][n]/1000,1)}
        plan.append(row)
    (OUT/'plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
    print(json.dumps({'customers':len(plan),'jobs':sum(x['job_count'] for x in plan),'legs':[x['previous_drive_minutes'] for x in plan[1:]],'locations_are_city_centers':True}))

def plan_jobs():
    plan=json.loads((OUT/'plan.json').read_text())
    templatefile=OUT/'service_templates.json'
    templates=json.loads(templatefile.read_text()) if templatefile.exists() else []
    if not templates:
        services=api('services?limit=100&offset=0&total=1')['data']
        for service in services:
            template=api('services/'+str(service['id']))['data']
            if isinstance(template.get('length'),(int,float)) and 0<template['length']<=600:
                templates.append(template)
        templatefile.write_text(json.dumps(templates,indent=2),encoding='utf-8')
    if not templates:raise RuntimeError('No usable service templates')
    calendar={'data':[]}
    for first,last in [(9,22),(23,31)]:
        part=api('jobs?'+urllib.parse.urlencode({'agenda':'agendaTwoWeeks','color_id':1,'schedule':'31','start':f'2026-10-{first:02d}T00:00:00.000Z','end':f'2026-10-{last:02d}T23:59:59.000Z','inc':'task'}))
        calendar['data'].extend(part.get('data',[]))
    busy=[]
    for row in calendar.get('data',[]):
        event=row.get('event') or {}
        if event.get('start') and event.get('end'):
            busy.append((dt.datetime.fromisoformat(event['start']).replace(tzinfo=None),dt.datetime.fromisoformat(event['end']).replace(tzinfo=None)))
    rng=random.Random()
    har=json.loads((ROOT/'job.har').read_text(encoding='utf-8-sig'))
    entry=next(e for e in har['log']['entries'] if e['request']['method']=='POST' and urllib.parse.urlsplit(e['request']['url']).path=='/api/jobs')
    prototype=json.loads(entry['request']['postData']['text'])
    for customer in plan:
        customer['jobs']=[]
        for n in range(customer['job_count']):
            service=rng.choice(templates);length=int(service['length']); candidates=[]
            for day in range(9,32):
                for minute in range(8*60,18*60-length+1,15):
                    start=dt.datetime(2026,10,day)+dt.timedelta(minutes=minute);end=start+dt.timedelta(minutes=length)
                    if all(end<=bstart-dt.timedelta(minutes=15) or start>=bend+dt.timedelta(minutes=15) for bstart,bend in busy):candidates.append((start,end))
            if not candidates:raise RuntimeError('No free slots for service '+str(service['id']))
            start,end=rng.choice(candidates);busy.append((start,end))
            body=copy.deepcopy(prototype)
            body.update({'customer_id':None,'location_id':None,'service_id':str(service['id']),'primary_schedule_id':'31','date':start.isoformat(timespec='milliseconds')+'Z','hours':length//60,'minutes':length%60,'repeat':0,'job_cycle':0,'locked':0,'always_confirmed':service.get('always_confirmed',0),'notify_tech':0,'notify_customer':{'isNotifyCustomer':False,'template':{}},'socket_id':'','invoice':None,'estimate':None,'documents':[],'materials':[],'note':'Florida routing test dataset'})
            body['recurrence']['frequency']='OFF'
            customer['jobs'].append({'index':n+1,'service_name':service['name'],'start':start.isoformat(),'end':end.isoformat(),'payload':body})
    (OUT/'execution_plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
    summary={'customers':len(plan),'jobs':sum(len(x['jobs']) for x in plan),'service_templates':len(templates),'schedule_id':31,'start':'2026-10-09','end':'2026-10-31','notification':False}
    print(json.dumps(summary))

def enrich_zip():
    geofile=OUT/'geocoded.json';locations=json.loads(geofile.read_text())
    for loc in locations:
        if loc.get('zip'):continue
        url='https://nominatim.openstreetmap.org/reverse?'+urllib.parse.urlencode({'lat':loc['lat'],'lon':loc['lng'],'format':'jsonv2','addressdetails':1,'zoom':18})
        result=request(url,{'User-Agent':'FloridaRoutingTestSetup/1.0'})
        address=result.get('address',{})
        if address.get('state')!='Florida' or not address.get('postcode'):raise RuntimeError('Missing ZIP '+loc['city'])
        loc['zip']=address['postcode'];geofile.write_text(json.dumps(locations,indent=2),encoding='utf-8')
        print('ZIP_RESOLVED '+loc['city'],flush=True);time.sleep(1.1)
    for filename in ['plan.json','execution_plan.json']:
        path=OUT/filename;plan=json.loads(path.read_text())
        for item in plan:item['location']['zip']=next(loc['zip'] for loc in locations if loc['city']==item['location']['city'])
        path.write_text(json.dumps(plan,indent=2),encoding='utf-8')
    statefile=OUT/'created.json';state=json.loads(statefile.read_text())
    if state.get('pending',{}).get('key')=='customer:1' and not state['customers'] and not state['jobs']:
        state['rejected']=[{'operation':state['pending'],'reason':'HTTP422 Service Zip cannot be blank; Billing Zip cannot be blank; success=false'}]
        state['pending']=None;statefile.write_text(json.dumps(state,indent=2),encoding='utf-8')

def execute():
    plan=json.loads((OUT/'execution_plan.json').read_text())
    statefile=OUT/'created.json'
    state=json.loads(statefile.read_text()) if statefile.exists() else {'customers':{},'jobs':{},'pending':None}
    if state.get('pending'):raise RuntimeError('Uncertain prior POST; resolve pending operation before resuming')
    def save():statefile.write_text(json.dumps(state,indent=2),encoding='utf-8')
    def post_once(path,body,key):
        state['pending']={'path':path,'key':key,'at':dt.datetime.now().isoformat()};save()
        try:result=api(path,body)
        except ApiRejected as err:
            state.setdefault('rejected',[]).append({'operation':state['pending'],'reason':str(err)});state['pending']=None;save();raise
        return result
    for item in plan:
        key=str(item['index'])
        if key not in state['customers']:
            number=api('customers/init')['data']['number']
            _,_,body=api_config();body=copy.deepcopy(body)
            body['profile'].update({'account_no':number,'first_name':item['name'],'last_name':'','email':'','phones':[],'tags':[]})
            body['service_location'].update({'location_name':item['name'],'address_to':item['name'],'location_note':'Synthetic routing test location at city center; not an actual customer residence','same_billing_location':True})
            loc=copy.deepcopy(item['location']);bill=copy.deepcopy(loc);bill.update({'bill_to':item['name'],'lat':None,'lng':None})
            body['service_location']['service_address']=loc;body['service_location']['billing_address']=bill
            result=post_once('customers',body,'customer:'+key)
            cid=str(result['data']['customer_id'])
            state['customers'][key]={'customer_id':cid,'name':item['name'],'city':loc['city'],'account_no':number};state['pending']=None;save()
            print('CREATED_CUSTOMER '+key+' id='+cid,flush=True)
        customer=state['customers'][key];cid=customer['customer_id']
        if not customer.get('location_id'):
            locations=api('customers/'+cid+'/locations/simplify')['data']
            active=[loc for loc in locations if not loc.get('deleted')]
            if len(active)!=1:raise RuntimeError('Location identity ambiguous for '+cid)
            customer['location_id']=str(active[0]['id']);save()
        for job in item['jobs']:
            jkey=key+':'+str(job['index'])
            if jkey not in state['jobs']:
                body=copy.deepcopy(job['payload']);body['customer_id']=cid;body['location_id']=customer['location_id']
                result=post_once('jobs',body,'job:'+jkey)
                state['jobs'][jkey]={'job_id':str(result['data']['id']),'customer_id':cid,'service_name':job['service_name'],'service_id':body['service_id'],'start':result['data']['start'],'end':result['data']['end']};state['pending']=None;save()
                print('CREATED_JOB '+jkey+' id='+state['jobs'][jkey]['job_id'],flush=True)
            record=state['jobs'][jkey]
            if not record.get('verified'):
                actual=api('jobs/'+record['job_id']+'?fields=name&type=0')['data']
                if str(actual['customer']['id'])!=cid or str(actual['location']['id'])!=customer['location_id'] or str(actual['job']['service']['id'])!=record['service_id'] or actual['event']['start']!=record['start'] or actual['event']['end']!=record['end'] or not any(str(s['id'])=='31' for s in actual['schedule']):raise RuntimeError('Readback mismatch for '+record['job_id'])
                record['event_id']=str(actual['event']['id']);record['verified']=True;save()
    print(json.dumps({'created_customers':len(state['customers']),'created_jobs':len(state['jobs']),'verified_jobs':sum(x.get('verified',False) for x in state['jobs'].values())}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['probe','prepare','plan_jobs','enrich_zip','execute']);args=parser.parse_args()
    globals()[args.action]()
