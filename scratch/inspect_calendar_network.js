const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  page.on('request', req => {
    const u = req.url();
    if (u.includes('events') || u.includes('calendar') || u.includes('jobs')) {
      console.log('REQ:', req.method(), u);
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('events')) {
      console.log('EVENTS STATUS:', res.status(), u);
      try {
        const text = await res.text();
        console.log('EVENTS PREVIEW:', text.slice(0, 200));
      } catch(e) {}
    }
  });

  console.log('Navigating to calendar...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31');
  await page.waitForTimeout(6000);

  await browser.close();
})();
