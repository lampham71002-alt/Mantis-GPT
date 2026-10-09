const { chromium } = require('playwright');

async function findHistoryViaUI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';

  const interceptedUrls = [];
  page.on('request', req => {
    const url = req.url();
    const h = req.headers();
    if (h['token']) token = h['token'];
    if (url.includes('mantis') || url.includes('history') || url.includes('feeds')) {
      interceptedUrls.push(url);
    }
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  console.log('Logged in. Navigating to Specific Rules page...');
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/mantis/settings/specific', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  console.log('Intercepted URLs on Specific Rules page:');
  interceptedUrls.forEach(u => console.log(' ->', u));

  // Let's also check the page text or dropdown to see the history runs!
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\nPage text snippet (first 1000 chars):');
  console.log(pageText.slice(0, 1000));

  await browser.close();
}

findHistoryViaUI().catch(console.error);
