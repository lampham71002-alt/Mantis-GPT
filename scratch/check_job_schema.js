const { chromium } = require('playwright');

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
    const res = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
      method: 'PUT',
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0', platform: 'web', 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-15T00:00:00+00:00', end: '2026-10-15T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    });
    const text = await res.text();
    const chunks = text.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const beforeJobs = chunks.find(c => c.type === 'jobs' && c.scope === 'before')?.data || [];
    const afterJobs = chunks.find(c => c.type === 'jobs' && c.scope === 'optimized')?.data || [];
    return {
      beforeSample: beforeJobs[0],
      beforeNames: beforeJobs.map(j => ({ id: j.id, customer: j.customer, name: j.name, title: j.title, tile: j.tile })),
      afterNames: afterJobs.map(j => ({ id: j.id, customer: j.customer, name: j.name, title: j.title, tile: j.tile }))
    };
  }, { tok: token });
  console.log('Sample job keys:', Object.keys(res.beforeSample || {}));
  console.log('Before jobs:', JSON.stringify(res.beforeNames, null, 2));
  console.log('Sample beforeJob customer object:', JSON.stringify(res.beforeSample?.customer, null, 2));
  await browser.close();
})();
