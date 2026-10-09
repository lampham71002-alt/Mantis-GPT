const { chromium } = require('playwright');

async function findHistory() {
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
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/activity/history?limit=20', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Total history records:', res.data ? res.data.length : 0);
  if (res.data) {
    res.data.forEach((h, idx) => {
      console.log(`[${idx+1}] ID: ${h.id} | Name: ${h.name || h.title} | Created: ${h.created_at || h.date} | Status: ${h.status} | Total Jobs: ${h.total_jobs || h.jobs_count}`);
      console.log('     Keys:', Object.keys(h));
      console.log('     Details:', JSON.stringify({ id: h.id, created_at: h.created_at, date: h.date, start_date: h.start_date, end_date: h.end_date }));
    });
  }

  await browser.close();
}

findHistory().catch(console.error);
