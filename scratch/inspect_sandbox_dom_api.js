const { chromium } = require('playwright');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const apis = [];
  page.on('response', res => {
    const u = res.url();
    if (u.includes('/api/routing/mantis/')) {
      apis.push({ url: u, status: res.status(), method: res.request().method() });
    }
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  console.log('Navigating to Sandbox...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  console.log('APIs intercepted on Sandbox:');
  console.log(JSON.stringify(apis, null, 2));

  // Check DOM text on Sandbox
  const pageText = await page.evaluate(() => document.body.innerText.slice(0, 800));
  console.log('\nPage text snippet:', pageText);

  await browser.close();
})();
