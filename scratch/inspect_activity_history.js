const { chromium } = require('playwright');

async function inspectHistory() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const res = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/activity/history?limit=10', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('History runs:', JSON.stringify(res.data ? res.data.map(h => ({
    id: h.id,
    start_date: h.start_date,
    end_date: h.end_date,
    status: h.status,
    jobs_count: h.jobs_count || h.total_jobs,
    created_at: h.created_at
  })) : res));

  await browser.close();
}

inspectHistory().catch(console.error);
