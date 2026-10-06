const { chromium } = require('playwright');

(async () => {
  console.log('=== LAUNCHING LIVE INTERACTIVE BROWSER ON RIGHT HALF OF SCREEN ===');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
    args: ['--window-position=900,0', '--window-size=1020,1040']
  });

  const context = await browser.newContext({ viewport: { width: 1000, height: 960 } });
  const page = await context.newPage();

  console.log('[STEP 1] Navigating to login page with domcontentloaded...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);

  console.log('[STEP 2] Navigating to Main Calendar view...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  console.log('[STEP 3] Navigating to Custom Rules Settings...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('[STEP 4] Clicking + Add Custom Rule at (760, 150)...');
  await page.mouse.click(760, 150);
  await page.waitForTimeout(4000);

  console.log('[STEP 5] Toggling Custom Rule ON at (405, 218)...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(4000);

  console.log('[STEP 6] Opening Sandbox Grid to verify applied rule changes...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000);

  console.log('[STEP 7] Keeping browser window active for 60 seconds...');
  await page.waitForTimeout(60000);

  await browser.close();
})();
