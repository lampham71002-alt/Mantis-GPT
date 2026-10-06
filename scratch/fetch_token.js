const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.fill('input[type="email"]', 'lamlam@gmail.com');
  await page.fill('input[type="password"]', 'Ahihi123456@');
  
  let authToken = '';
  page.on('request', request => {
    const headers = request.headers();
    if (headers['token']) {
      authToken = headers['token'];
    }
  });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log('Captured Token:', authToken ? authToken.substring(0, 20) + '...' : 'NONE');
  await browser.close();
})();
