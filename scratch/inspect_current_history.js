const { chromium } = require('playwright');

(async () => {
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
    const url = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=10';
    const r = await fetch(url, {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Top 10 History records:');
  (res.data || []).forEach((h, i) => {
    console.log(`[${i+1}] ID: ${h.id} | Mode: ${h.mode} | Created: ${h.created_at} | Status: ${h.status} | SavedDrive: ${h.stats?.saved_drive_time?.value}m | SavedDist: ${h.stats?.saved_distance?.value}mi`);
  });

  await browser.close();
})();
