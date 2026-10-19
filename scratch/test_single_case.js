const { chromium } = require('playwright');
const crypto = require('crypto');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const res = await page.evaluate(async ({ tok }) => {
    const headers = { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0', platform: 'web', 'Content-Type': 'application/json' };
    
    // Create rule: first_stop for HCM Customer 24
    const payload = {
      conversation_id: 'conv_' + Date.now(),
      title: 'Test First Stop Cust 24',
      description: 'First stop for HCM Customer 24',
      status: 1,
      rule_detail: { case: { text: '' }, rule: { text: 'first_stop' }, issue: { text: '' }, conflict_system_rule_keys: [] },
      executable_logic: {
        id: 'rule_' + Date.now(),
        name: 'Test First Stop Cust 24',
        rule: 'first_stop',
        rules: [{ actions: [{ params: [], action_type: 'first_stop' }], targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] } }],
        summary: 'first_stop',
        classify_action: 'gen_rule'
      }
    };
    const crRes = await fetch('https://apiv2.gdesk.io/api/routing/mantis/custom-rules', {
      method: 'POST', headers, body: JSON.stringify(payload)
    }).then(r => r.json());
    const ruleId = crRes.data?.id;

    // Call optimize for 2026-10-15
    const optRes = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
      method: 'PUT',
      headers: { ...headers, Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-15T00:00:00+00:00', end: '2026-10-15T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    }).then(r => r.text());

    // Disable rule
    if (ruleId) {
      await fetch(`https://apiv2.gdesk.io/api/routing/mantis/custom-rules/${ruleId}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 0 })
      });
    }

    const chunks = optRes.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const beforeJobs = chunks.find(c => c.type === 'jobs' && c.scope === 'before')?.data || [];
    const afterJobs = chunks.find(c => c.type === 'jobs' && c.scope === 'optimized')?.data || [];

    return {
      ruleId,
      before: beforeJobs.map(j => ({ name: j.customer?.full_name, date: j.date_label, header: j.tile?.header, start: j.event?.start })),
      after: afterJobs.map(j => ({ name: j.customer?.full_name, date: j.date_label, header: j.tile?.header, start: j.event?.start }))
    };
  }, { tok: token });

  console.log('Result for First Stop Cust 24:');
  console.log('Rule ID:', res.ruleId);
  console.log('BEFORE:', JSON.stringify(res.before, null, 2));
  console.log('AFTER:', JSON.stringify(res.after, null, 2));

  await browser.close();
})();
