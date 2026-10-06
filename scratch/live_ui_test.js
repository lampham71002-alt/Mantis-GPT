const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser to inspect Live UI...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to https://r2.gdesk.io ...');
  await page.goto('https://r2.gdesk.io/auth/login');
  
  await page.screenshot({ path: 'login_screen.png' });
  console.log('Saved login_screen.png');

  await browser.close();
})();
