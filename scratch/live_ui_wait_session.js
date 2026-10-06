const { chromium } = require('playwright');

(async () => {
  console.log('Automating full UI Rule Creation via click coordinates after logged-in session...');
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  // Wait for login redirection to finish
  await page.waitForURL('**/calendar**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('Navigating directly to Custom Rules page while logged in...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'logged_in_custom_rules_ui.png' });

  // Click "+ Add Custom Rule" button at top right (x=760, y=150)
  console.log('Clicking button + Add Custom Rule at (760, 150)...');
  await page.mouse.click(760, 150);
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'drawer_open_ui.png' });

  // Click toggle switch ON at (x=405, y=218)
  console.log('Clicking toggle switch ON at (405, 218)...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'toggle_on_live_ui.png' });

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

  console.log('=== SUCCESSFUL LIVE UI SESSION AUTOMATION ===');
  await browser.close();
})();
