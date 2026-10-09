const { chromium } = require('playwright');
const fs = require('fs');

async function inspectFeedsHistory() {
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
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history?limit=15', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Feeds History records:');
  if (Array.isArray(res.data)) {
    res.data.forEach((h, idx) => {
      console.log(`[${idx+1}] ID: ${h.id} | Date: ${h.created_at} | Mode: ${h.mode} | Jobs: ${h.jobs_count} | Status: ${h.status}`);
    });
    fs.writeFileSync('reports/recent_history_feeds.json', JSON.stringify(res.data, null, 2));
  } else {
    console.log('Raw:', JSON.stringify(res));
  }

  await browser.close();
}

inspectFeedsHistory().catch(console.error);
