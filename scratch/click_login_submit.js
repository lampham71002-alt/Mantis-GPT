const { chromium } = require('playwright');

(async () => {
  console.log('Automating live UI submit button click...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');

  let capturedToken = '';
  page.on('request', req => {
    const headers = req.headers();
    if (headers['token']) {
      capturedToken = headers['token'];
      console.log('>>> CAPTURED LIVE TOKEN:', capturedToken);
    }
  });

  // Target the purple button directly using class / text / click
  await page.click('button.mantis-button, button[type="submit"], button:has-text("Log In"), div:has-text("Log In")');
  
  await page.waitForTimeout(10000);
  console.log('Current URL after submit:', page.url());

  await page.screenshot({ path: 'after_submit.png' });
  await browser.close();
})();
