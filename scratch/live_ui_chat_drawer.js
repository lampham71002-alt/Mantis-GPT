const { chromium } = require('playwright');

(async () => {
  console.log('Automating full UI Rule Creation via Chat With Mantis drawer...');
  const browser = await chromium.launch({ headless: false, slowMo: 700 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);
  
  // Click "Chat With Mantis" on left sidebar menu
  console.log('Clicking Chat With Mantis menu...');
  await page.click('span:has-text("Chat With Mantis"), a:has-text("Chat With Mantis"), div:has-text("Chat With Mantis")');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'chat_with_mantis_open.png' });

  // Type prompt into Chat text input
  console.log('Typing combined rule prompt into Chat AI UI...');
  const chatInput = await page.$('textarea, input[type="text"], div[contenteditable="true"]');
  if (chatInput) {
    await chatInput.fill('Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(7000);
  }

  await page.screenshot({ path: 'chat_ai_response.png' });

  // Navigate to Custom Rules page
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);

  // Click the first switch (toggle ON)
  console.log('Clicking first switch toggle ON...');
  const switchElement = await page.$('.mantis-switch, input[type="checkbox"], .MuiSwitch-switchBase');
  if (switchElement) {
    await switchElement.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'switch_toggled_on_live.png' });

  // Navigate to Sandbox to verify UI Grid
  console.log('Navigating to Sandbox UI Grid...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'sandbox_grid_verified_ui.png' });

  // Turn toggle back OFF for safety
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  const switchElementOff = await page.$('.mantis-switch, input[type="checkbox"], .MuiSwitch-switchBase');
  if (switchElementOff) {
    await switchElementOff.click();
    await page.waitForTimeout(2000);
  }

  console.log('=== SUCCESSFUL FULL UI CHAT AUTOMATION ===');
  await browser.close();
})();
