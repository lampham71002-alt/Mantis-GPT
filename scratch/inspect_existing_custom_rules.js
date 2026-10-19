const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const res = await page.evaluate(async ({ tok }) => {
    const headers = { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0', platform: 'web', 'Content-Type': 'application/json' };
    const crRes = await fetch('https://apiv2.gdesk.io/api/routing/mantis/custom-rules', { headers }).then(r => r.json());
    return crRes.data?.slice(0, 5);
  }, { tok: token });

  console.log('Sample existing custom rules:');
  console.log(JSON.stringify(res, null, 2));

  await browser.close();
})();
