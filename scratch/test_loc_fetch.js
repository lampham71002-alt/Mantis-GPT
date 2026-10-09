const { chromium } = require('playwright');

async function testLoc() {
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

  const loc = await page.evaluate(async (tok) => {
    const res = await fetch('https://apiv2.gdesk.io/api/customers/1567/locations/simplify', {
      headers: { 'token': tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await res.json();
  }, token);

  console.log('Location for 1567:', JSON.stringify(loc));
  await browser.close();
}

testLoc().catch(console.error);
