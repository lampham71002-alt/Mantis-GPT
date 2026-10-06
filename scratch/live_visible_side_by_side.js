const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser visible on right half of screen...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-position=960,0', '--window-size=960,1040']
  });
  const context = await browser.newContext({ viewport: { width: 940, height: 980 } });
  const page = await context.newPage();

  console.log('Step 1: Navigating to login page...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);

  console.log('Step 2: Opening Main Calendar...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31');
  await page.waitForTimeout(5000);

  console.log('Step 3: Opening Custom Rules Settings...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);

  console.log('Step 4: Clicking + Add Custom Rule...');
  await page.mouse.click(760, 150);
  await page.waitForTimeout(5000);

  console.log('Step 5: Toggling Custom Rule ON...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(4000);

  console.log('Step 6: Opening Sandbox Grid to verify applied rule changes...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(8000);

  console.log('Step 7: Turning Toggle back OFF for safety...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  console.log('=== VISIBLE LIVE TEST COMPLETED ===');
  await browser.close();
})();
