const { chromium } = require('playwright');
const fs = require('fs');

async function getServices() {
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

  const res = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/services?limit=50', {
      headers: { 'token': tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('Available services count:', res.data ? res.data.length : 0);
  if (res.data) {
    res.data.slice(0, 10).forEach(s => {
      console.log('ID: ' + s.id + ' | Name: ' + s.name + ' | Length: ' + s.length);
    });
    fs.writeFileSync('reports/available_services.json', JSON.stringify(res.data, null, 2));
  }

  await browser.close();
}
getServices().catch(console.error);
