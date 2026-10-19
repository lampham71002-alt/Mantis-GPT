const { chromium } = require('playwright');
const crypto = require('crypto');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULES = '249,261';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let token = '';
  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // 1. Check Case 4 (HCM Customer 12 across 14/10 -> 16/10 when Rule 1996 is ON)
  const check4 = await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/1996/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 1 }) });
    const res = await fetch(`${baseUrl}/api/routing/mantis/manual/optimize`, {
      method: 'PUT',
      headers: { ...headers, Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-14T00:00:00+00:00', end: '2026-10-16T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    }).then(r => r.text());
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/1996/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 0 }) });
    const chunks = res.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const after = chunks.find(c => c.type === 'jobs' && c.scope === 'optimized')?.data || [];
    const c12 = after.find(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
    const sameDayJobs = after.filter(j => j.date_label === c12?.date_label).sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
    const stopIdx = sameDayJobs.findIndex(j => String(j.job?.id) === String(c12?.job?.id));
    return { c12Date: c12?.date_label, c12Header: c12?.tile?.header, c12Tech: c12?.schedule?.name, stopPos: `${stopIdx + 1}/${sameDayJobs.length}` };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL });
  console.log('Case 4 (Rule 1996 on 14/10-16/10):', check4);

  // 2. Check Case 5 (Rule 1990 on 15/10 -> 15/10)
  const check5 = await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/1990/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 1 }) });
    const res = await fetch(`${baseUrl}/api/routing/mantis/manual/optimize`, {
      method: 'PUT',
      headers: { ...headers, Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-15T00:00:00+00:00', end: '2026-10-15T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    }).then(r => r.text());
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/1990/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 0 }) });
    const chunks = res.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const before = chunks.find(c => c.type === 'jobs' && c.scope === 'before')?.data || [];
    const after = chunks.find(c => c.type === 'jobs' && c.scope === 'optimized')?.data || [];
    return {
      beforeCount: before.length,
      afterCount: after.length,
      c13InBefore: Boolean(before.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'))),
      c13InAfter: Boolean(after.find(j => (j.customer?.full_name || '').includes('HCM Customer 13')))
    };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL });
  console.log('Case 5 (Rule 1990 on 15/10):', check5);

  // 3. Check Case 10 (HCM Customer 20 has 45m duration on 15/10 -> fits inside 1-hour window 15:00-16:00!)
  const check10 = await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    // Create a rule for HCM Customer 20 (45-min job) with Force lam 1 + Movement ±2 + Strict 15:00-16:00
    const payload = {
      conversation_id: crypto.randomUUID(),
      title: 'CASE 10 VERIFY: Force lam 1 + Movement ±2 + Strict 15:00-16:00 (HCM Customer 20 - 45m job)',
      description: 'For HCM Customer 20, force technician lam 1, limit movement to 2 days, and schedule strictly between 3:00 PM and 4:00 PM.',
      status: 1,
      rule_detail: { case: { text: '' }, rule: { text: '' }, issue: { text: '' }, conflict_system_rule_keys: [] },
      executable_logic: {
        id: 'rule_10v_' + Date.now(),
        name: 'CASE 10 VERIFY',
        rule: 'Strict 15:00-16:00',
        rules: [{
          actions: [
            { params: { tech_name: 'lam 1' }, action_type: 'force_tech' },
            { params: { max_days: 2 }, action_type: 'movement_limit' },
            { params: { strict: true, start_sec: 54000, end_sec: 57600, start_time: '15:00:00', end_time: '16:00:00' }, action_type: 'time_window' }
          ],
          targets: { match: 'all', customer_names: ['HCM Customer 20'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
        }],
        summary: 'Strict 15:00-16:00',
        classify_action: 'gen_rule'
      }
    };
    const cr = await fetch(`${baseUrl}/api/routing/mantis/custom-rules`, { method: 'POST', headers, body: JSON.stringify(payload) }).then(r => r.json());
    const rId = cr.data?.id;
    const res = await fetch(`${baseUrl}/api/routing/mantis/manual/optimize`, {
      method: 'PUT',
      headers: { ...headers, Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-15T00:00:00+00:00', end: '2026-10-15T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    }).then(r => r.text());
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/${rId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 0 }) });
    const chunks = res.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const after = chunks.find(c => c.type === 'jobs' && c.scope === 'optimized')?.data || [];
    const c20 = after.find(j => (j.customer?.full_name || '').includes('HCM Customer 20'));
    return { ruleId: rId, c20Date: c20?.date_label, c20Header: c20?.tile?.header, c20Start: c20?.event?.start, c20End: c20?.event?.end, c20Tech: c20?.schedule?.name };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL });
  console.log('Case 10 (45m job vs 60m job in Strict 15:00-16:00):', check10);

  await browser.close();
})();
