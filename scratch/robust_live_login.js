const { chromium } = require('playwright');

(async () => {
  console.log('Automating live UI login via exact form selector...');
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
  if (inputs.length >= 2) {
    await inputs[0].fill('lamlam@gmail.com');
    await inputs[1].fill('Ahihi123456@');
  }

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.innerText();
    if (text.toLowerCase().includes('log in') || text.toLowerCase().includes('login')) {
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(7000);
  console.log('Current URL after login attempt:', page.url());

  await page.screenshot({ path: 'logged_in_state.png' });
  await browser.close();
})();
