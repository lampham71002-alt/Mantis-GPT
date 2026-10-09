const { chromium } = require('playwright');
const fs = require('fs');

async function inspectSpecificRules() {
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
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules?limit=30', {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Specific rules count:', res.data ? res.data.length : 0);
  if (res.data) {
    res.data.forEach((rule, idx) => {
      console.log(`[${idx+1}] ID: ${rule.id} | history_id: ${rule.history_id} | date: ${rule.created_at || rule.date} | status: ${rule.status} | desc: ${rule.description || rule.title || JSON.stringify(rule.item)}`);
    });
    fs.writeFileSync('reports/current_specific_rules.json', JSON.stringify(res.data, null, 2));
  } else {
    console.log('Raw response:', JSON.stringify(res));
  }

  await browser.close();
}

inspectSpecificRules().catch(console.error);
