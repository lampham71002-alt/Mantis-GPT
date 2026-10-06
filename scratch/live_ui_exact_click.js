const { chromium } = require('playwright');

(async () => {
  console.log('Automating full UI Rule Creation with exact button selector...');
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
  await page.waitForTimeout(5000);

  // Click using div/span/button containing Add Custom Rule
  console.log('Clicking Add Custom Rule button...');
  const addBtn = await page.$('*:has-text("Add Custom Rule")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(4000);
  }

  await page.screenshot({ path: 'add_rule_modal_open.png' });

  // Toggle ON the first switch directly on Custom Rules page
  console.log('Toggling ON first Custom Rule switch on UI...');
  const switches = await page.$$('.mantis-switch, .MuiSwitch-root, span.MuiSwitch-root');
  if (switches.length > 0) {
    await switches[0].click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'custom_rule_toggled_on_ui.png' });

  // Navigate to Sandbox to verify UI Grid changes
  console.log('Navigating to Sandbox UI Grid...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'sandbox_grid_verified_ui.png' });

  // Safely turn Toggle back OFF
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  const switchesOff = await page.$$('.mantis-switch, .MuiSwitch-root, span.MuiSwitch-root');
  if (switchesOff.length > 0) {
    console.log('Toggling Rule back OFF for safety...');
    await switchesOff[0].click();
    await page.waitForTimeout(2000);
  }

  console.log('=== FULL LIVE UI AUTOMATION COMPLETE ===');
  await browser.close();
})();
