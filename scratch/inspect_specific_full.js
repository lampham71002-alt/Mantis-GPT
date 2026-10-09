const { chromium } = require('playwright');
const fs = require('fs');

async function inspectFull() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let fullToken = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) fullToken = h['token'];
  });

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // Navigate to Specific Rules page
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/specific', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const ruleList = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules?limit=10', {
      headers: {
        'token': tok,
        'gd-branch-id': 'GDONWL5A5MI6',
        'Content-Type': 'application/json'
      }
    });
    return await r.json();
  }, fullToken);

  console.log('List of specific rules:');
  console.log(JSON.stringify(ruleList, null, 2));

  // Check detail of rule 1743
  const ruleDetail = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules/1743', {
      headers: {
        'token': tok,
        'gd-branch-id': 'GDONWL5A5MI6',
        'Content-Type': 'application/json'
      }
    });
    return await r.json();
  }, fullToken);
  console.log('\nDetail of 1743:');
  console.log(JSON.stringify(ruleDetail, null, 2));

  // Check activity history
  const activity = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/activity/history?limit=10', {
      headers: {
        'token': tok,
        'gd-branch-id': 'GDONWL5A5MI6',
        'Content-Type': 'application/json'
      }
    });
    return await r.json();
  }, fullToken);
  console.log('\nActivity History (/activity/history):');
  console.log(JSON.stringify(activity, null, 2));

  await browser.close();
}

inspectFull().catch(console.error);
