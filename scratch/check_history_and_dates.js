const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let token = '';
  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const branch = 'GD1LK8RC5OH0';
  const info = await page.evaluate(async ({ tok, bId }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json'
    };
    const histRes = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00.000Z&end=2026-10-25T23:59:59.999Z&schedule_ids=249&routing_type=all', { headers });
    const hist = await histRes.json();
    return { history: hist.data };
  }, { tok: token, bId: branch });

  console.log('Recent History rows:', JSON.stringify(info.history?.slice(0, 10), null, 2));
  await browser.close();
})();
