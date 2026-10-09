const { chromium } = require('playwright');

async function inspectFeedsPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';

  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    const h = req.headers();
    if (h['token']) token = h['token'];
    if (url.includes('api/routing/mantis')) {
      apiCalls.push(url);
    }
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  console.log('Navigating to Activity Feed...');
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/mantis/feeds', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  console.log('API calls captured on Feeds page:');
  apiCalls.forEach(u => console.log(' ->', u));

  // Print text content to find the run at 10/09/2026 15:02
  const text = await page.evaluate(() => document.body.innerText);
  const lines = text.split('\n').filter(l => l.includes('10/09/2026') || l.includes('15:02') || l.includes('Autopilot') || l.includes('History'));
  console.log('\nRelevant lines from page:');
  console.log(lines.slice(0, 30).join('\n'));

  await browser.close();
}

inspectFeedsPage().catch(console.error);
