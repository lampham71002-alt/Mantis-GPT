const { chromium } = require('playwright');
const fs = require('fs');

async function inspectSpecific() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let token = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Logging into lamlam@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  console.log('Token captured:', token ? token.substring(0, 15) : 'NONE');

  // Go to Specific rules page
  console.log('2. Navigating to Specific Rules page...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/specific', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'reports/specific_rules_page_live.png' });

  // Query Specific rules API
  const res = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules?limit=20', {
      headers: {
        'token': tok,
        'gd-branch-id': 'GDONWL5A5MI6',
        'Content-Type': 'application/json'
      }
    });
    return await r.json();
  }, token);

  console.log('\n--- SPECIFIC RULES (Total returned: ' + (res.data ? res.data.length : 0) + ') ---');
  if (res.data) {
    res.data.slice(0, 5).forEach((rule, idx) => {
      console.log(`[${idx+1}] ID: ${rule.id} | Status: ${rule.status} | Item: ${JSON.stringify(rule.item)} | Desc: ${rule.description}`);
    });
  }

  // Check history feeds
  const hist = await page.evaluate(async (tok) => {
    const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history?limit=5', {
      headers: {
        'token': tok,
        'gd-branch-id': 'GDONWL5A5MI6',
        'Content-Type': 'application/json'
      }
    });
    return await r.json();
  }, token);

  console.log('\n--- HISTORY FEEDS (Total returned: ' + (hist.data ? hist.data.length : 0) + ') ---');
  if (hist.data) {
    hist.data.forEach((h, idx) => {
      console.log(`History [${idx+1}] ID: ${h.id} | Mode: ${h.mode} | Jobs: ${h.jobs_count} | Date: ${h.created_at}`);
    });
  }

  await browser.close();
}

inspectSpecific().catch(console.error);
