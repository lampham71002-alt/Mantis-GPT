const { chromium } = require('playwright');

(async () => {
  console.log('Automating full live UI login and token capture...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login');
  
  // Fill credentials using placeholder/input selectors
  await page.fill('input[placeholder="Username or Email"]', 'lamlam@gmail.com');
  await page.fill('input[placeholder="Password"]', 'Ahihi123456@');
  
  let capturedToken = '';
  page.on('request', req => {
    const headers = req.headers();
    if (headers['token']) {
      capturedToken = headers['token'];
    }
  });

  await page.click('button:has-text("Log In")');
  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Login Result URL:', page.url());
  console.log('Captured Token:', capturedToken ? capturedToken.substring(0, 25) + '...' : 'NONE');

  await page.screenshot({ path: 'dashboard_screen.png' });
  await browser.close();
})();
