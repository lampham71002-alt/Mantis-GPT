const { chromium } = require('playwright');

(async () => {
  console.log('Automating UI Click on exact purple Add Custom Rule button...');
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
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

  // Click exact purple button selector using bounding box
  const btn = await page.$('button.MuiButton-root, button[class*="MuiButton"]');
  if (btn) {
    const box = await btn.boundingBox();
    console.log('Button box:', box);
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: 'drawer_opened_live.png' });

  // Click exact toggle switch at x=405, y=218
  console.log('Clicking first switch toggle at (405, 218)...');
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'switch_toggled_live.png' });

  await browser.close();
})();
