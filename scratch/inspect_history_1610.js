const { chromium } = require('playwright');
const fs = require('fs');

async function inspectHistory1610() {
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
    const detail = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history/1610', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    }).then(r => r.json());

    const logs = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history/1610/logs', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    }).then(r => r.json());

    return { detail, logs };
  }, token);

  fs.writeFileSync('reports/history_1610_detail.json', JSON.stringify(res.detail, null, 2));
  fs.writeFileSync('reports/history_1610_logs.json', JSON.stringify(res.logs, null, 2));

  console.log('--- HISTORY 1610 DETAIL ---');
  console.log('Period:', res.detail.data?.period);
  console.log('Jobs count:', res.detail.data?.jobs_count);
  console.log('Mode:', res.detail.data?.mode);
  console.log('Schedules:', res.detail.data?.schedules);
  console.log('Logs count:', res.logs.data ? (Array.isArray(res.logs.data) ? res.logs.data.length : Object.keys(res.logs.data).length) : 0);

  if (Array.isArray(res.logs.data) && res.logs.data.length > 0) {
    console.log('\nSample items in History 1610:');
    res.logs.data.slice(0, 10).forEach((item, i) => {
      console.log(`[${i+1}] Job ID: ${item.item?.id || item.id} | Customer: ${item.item?.customer_name || item.customer_name || item.item?.customer?.name} | Service: ${item.item?.service_name || item.service_name} | Tech: ${item.item?.schedule_name || item.schedule_name} | Date: ${item.item?.date || item.date}`);
    });
  }

  await browser.close();
}

inspectHistory1610().catch(console.error);
