const { chromium } = require('playwright');

async function inspectJobDetails() {
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
    const r = await fetch('https://apiv2.gdesk.io/api/jobs?schedule=249&start=2026-10-10T00:00:00.000Z&end=2026-10-15T23:59:59.000Z', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  if (res.data && res.data.length > 0) {
    const j = res.data[0];
    console.log('job object:', JSON.stringify(j.job));
    console.log('event object:', JSON.stringify(j.event));
  }
  await browser.close();
}

inspectJobDetails().catch(console.error);
