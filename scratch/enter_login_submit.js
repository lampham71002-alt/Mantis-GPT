const { chromium } = require('playwright');

(async () => {
  console.log('Automating live UI form submit via Enter key...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  let capturedToken = '';
  page.on('request', req => {
    const headers = req.headers();
    if (headers['token']) {
      capturedToken = headers['token'];
      console.log('>>> CAPTURED LIVE TOKEN:', capturedToken);
    }
  });

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(10000);
  console.log('Current URL after Enter:', page.url());

  await page.screenshot({ path: 'after_enter.png' });
  await browser.close();
})();
