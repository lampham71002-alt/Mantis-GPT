const { chromium } = require('playwright');
const fs = require('fs');

async function testHistoryParams() {
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
    // Thử với start & end
    const url = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=30';
    const r = await fetch(url, {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Result with ISO start/end:');
  if (res.data) {
    console.log(`Found ${res.data.length} records!`);
    res.data.forEach((h, idx) => {
      console.log(`[${idx+1}] ID: ${h.id} | Date: ${h.created_at} | Mode: ${h.mode} | Jobs: ${h.jobs_count || h.total_jobs} | Status: ${h.status}`);
    });
    fs.writeFileSync('reports/history_1502_search.json', JSON.stringify(res.data, null, 2));
  } else {
    console.log('Raw:', JSON.stringify(res));
  }

  await browser.close();
}

testHistoryParams().catch(console.error);
