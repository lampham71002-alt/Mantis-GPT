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
    if (u.includes('routing') || u.includes('autopilot') || u.includes('calendar') || u.includes('schedules')) {
      console.log('REQ:', req.method(), u);
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('autopilot/jobs')) {
      console.log('AUTOPILOT JOBS STATUS:', res.status());
    }
  });

  console.log('Navigating to sandbox...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(10000);

  // Check what date is selected on sandbox UI!
  const dateText = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els.filter(e => e.innerText && (e.innerText.includes('2026') || e.innerText.includes('Oct'))).map(e => e.innerText.slice(0, 50)).slice(0, 10);
  });
  console.log('Dates found on UI:', dateText);

  await browser.close();
})();
