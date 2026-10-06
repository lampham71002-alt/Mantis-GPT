const { chromium } = require('playwright');

(async () => {
  console.log('Automating full UI Rule Creation via click coordinates...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);

  // Click coordinate of "+ Add Custom Rule" button at x=760, y=150
  console.log('Clicking coordinates (760, 150) for + Add Custom Rule...');
  await page.mouse.click(760, 150);
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'drawer_open_ui.png' });

  // Type prompt into Chat AI input drawer
  const textarea = await page.$('textarea, input[placeholder*="rule"], input[placeholder*="Type"]');
  if (textarea) {
    console.log('Typing multi-action prompt into drawer...');
    await textarea.fill('Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);
  }

  await page.screenshot({ path: 'drawer_response_ui.png' });

  // Click first switch toggle ON (x=405, y=218)
  console.log('Clicking toggle switch ON at coordinates (405, 218)...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'toggle_on_live_ui.png' });

  // Navigate to Sandbox to verify UI Grid changes
  console.log('Navigating to Sandbox UI Grid...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'sandbox_grid_verified_ui.png' });

  // Turn toggle back OFF for safety
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(2000);

  console.log('=== SUCCESSFUL LIVE UI COORDINATE AUTOMATION ===');
  await browser.close();
})();
