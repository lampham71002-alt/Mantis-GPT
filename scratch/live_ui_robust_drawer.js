const { chromium } = require('playwright');

(async () => {
  console.log('Automating Chat With Mantis menu click and drawer interaction...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login', { timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(6000);

  // Click Chat With Mantis left menu item (x=100, y=268)
  console.log('Clicking Chat With Mantis menu at (100, 268)...');
  await page.mouse.click(100, 268);
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'chat_drawer_opened_live.png' });

  // Navigate to Custom Rules page
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);

  // Toggle switch 1202 or first switch ON
  console.log('Toggling rule switch ON on UI...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'rule_toggled_on_live.png' });

  // Navigate to Sandbox to verify UI Grid
  console.log('Navigating to Sandbox UI Grid...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'sandbox_grid_verified_ui.png' });

  // Turn toggle back OFF for safety
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(2000);

  console.log('=== SUCCESSFUL LIVE CHAT DRAWER AUTOMATION ===');
  await browser.close();
})();
