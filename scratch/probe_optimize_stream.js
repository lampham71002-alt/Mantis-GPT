const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tabSandbox = await context.newPage();
  const tabDashboard = await context.newPage();
  const tabActivity = await context.newPage();

  let token = '';
  tabSandbox.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('Logging in...');
  await tabSandbox.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.waitForSelector('input', { timeout: 30000 });
  const inputs = await tabSandbox.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await tabSandbox.waitForTimeout(6000);

  console.log('Token captured:', token ? token.slice(0, 15) + '...' : 'NONE');

  const branch = 'GD1LK8RC5OH0';
  await tabSandbox.goto(`https://r2.gdesk.io/${branch}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabDashboard.goto(`https://r2.gdesk.io/${branch}/mantis/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabActivity.goto(`https://r2.gdesk.io/${branch}/mantis/activity-feed`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.waitForTimeout(4000);

  // Test calling manual/optimize for 2026-10-15
  const probeRes = await tabSandbox.evaluate(async ({ tok, bId }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    };
    const body = {
      schedule_ids: '249',
      start: '2026-10-15T00:00:00+00:00',
      end: '2026-10-15T23:59:59+00:00',
      statuses: -1,
      inc: 'recurring',
      color_id: 1,
      exclude: [6, 0]
    };
    const res = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    const text = await res.text();
    const lines = text.split('\n').filter(Boolean);
    const parsed = [];
    for (const l of lines) {
      try { parsed.push(JSON.parse(l)); } catch (e) {}
    }
    return { status: res.status, count: parsed.length, chunks: parsed };
  }, { tok: token, bId: branch });

  console.log('Optimize status:', probeRes.status, 'chunks:', probeRes.count);
  fs.writeFileSync('reports/probe_optimize_2026_10_15.json', JSON.stringify(probeRes, null, 2));
  for (const c of probeRes.chunks) {
    console.log('Chunk:', c.type, c.scope || '', c.optimization_id || '');
    if (c.type === 'stats' || c.type === 'done' || c.type === 'completed') {
      console.log(JSON.stringify(c, null, 2));
    }
  }

  await browser.close();
})();
