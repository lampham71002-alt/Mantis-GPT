const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('=== STARTING LIVE SANDBOX VS CALENDAR COMPARISON FOR COMBINED RULES ===');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(6000);

  // 2. Open Calendar main view & capture screenshot
  console.log('Capturing Main Calendar View...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'calendar_main_view.png' });

  // 3. Open Custom Rules & Toggle Rule 1202 ON
  console.log('Navigating to Custom Rules & Toggling Rule ON...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);
  await page.mouse.click(405, 218); // Click toggle switch 1
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'rule_toggled_on.png' });

  // 4. Open Sandbox Grid & capture screenshot for comparison
  console.log('Navigating to Sandbox Grid to verify applied rule changes...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'sandbox_grid_view.png' });

  // 5. Turn toggle back OFF for safety
  console.log('Turning toggle back OFF for safety...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(2000);

  console.log('=== COMPARISON COMPLETE ===');
  await browser.close();
})();
