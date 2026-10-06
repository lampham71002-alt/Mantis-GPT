const { chromium } = require('playwright');

(async () => {
  console.log('Automating full UI Rule Creation & Toggle ON...');
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
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

  // 1. Click "+ Add Custom Rule" button
  console.log('Clicking + Add Custom Rule...');
  await page.click('button:has-text("+ Add Custom Rule"), button:has-text("Add Custom Rule")');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'add_rule_modal_open.png' });

  // 2. Type prompt into Chat AI drawer/input
  const chatInput = await page.$('textarea, input[placeholder*="Type"], input[placeholder*="rule"], div[contenteditable="true"]');
  if (chatInput) {
    console.log('Typing prompt into Chat AI UI...');
    await chatInput.fill('Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(7000);
  }

  await page.screenshot({ path: 'ai_compiled_rule_ui.png' });

  // 3. Navigate back to Custom Rules & Toggle Rule 1202 or first toggle ON
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);

  const toggles = await page.$$('.mantis-switch, input[type="checkbox"], span.MuiSwitch-root, span.MuiSwitch-switchBase');
  if (toggles.length > 0) {
    console.log('Toggling ON first Custom Rule on UI...');
    await toggles[0].click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'custom_rule_toggled_on_ui.png' });

  // 4. Navigate to Sandbox to verify UI Grid changes
  console.log('Navigating to Sandbox UI Grid...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'sandbox_grid_verified_ui.png' });

  // 5. Safely turn Toggle back OFF
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  const togglesOff = await page.$$('.mantis-switch, input[type="checkbox"], span.MuiSwitch-root, span.MuiSwitch-switchBase');
  if (togglesOff.length > 0) {
    console.log('Toggling Rule back OFF for safety...');
    await togglesOff[0].click();
    await page.waitForTimeout(2000);
  }

  console.log('=== FULL LIVE UI AUTOMATION COMPLETE ===');
  await browser.close();
})();
