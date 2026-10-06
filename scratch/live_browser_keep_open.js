const { chromium } = require('playwright');

(async () => {
  console.log('=== LAUNCHING LIVE INTERACTIVE BROWSER ON RIGHT HALF OF SCREEN ===');
  
  // Launch visible browser positioned on right side of screen, keeping it open
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: [
      '--window-position=900,0',
      '--window-size=1020,1040',
      '--no-shutdown-on-connection-close'
    ]
  });

  const context = await browser.newContext({ viewport: { width: 1000, height: 960 } });
  const page = await context.newPage();

  console.log('[STEP 1] Navigating to https://r2.gdesk.io/auth/login ...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);

  console.log('[STEP 2] Opening Main Calendar view...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31');
  await page.waitForTimeout(6000);

  console.log('[STEP 3] Opening Custom Rules Settings...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(5000);

  console.log('[STEP 4] Clicking + Add Custom Rule...');
  await page.mouse.click(760, 150);
  await page.waitForTimeout(5000);

  console.log('[STEP 5] Toggling Custom Rule ON...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(4000);

  console.log('[STEP 6] Opening Sandbox Grid to verify applied rule changes...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(10000);

  console.log('[STEP 7] Keeping browser open for user inspection (Waiting 60 seconds)...');
  await page.waitForTimeout(60000);

  await browser.close();
})();
