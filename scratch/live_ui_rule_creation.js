const { chromium } = require('playwright');

(async () => {
  console.log('Starting full interactive UI Rule Creation on live browser...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('https://r2.gdesk.io/auth/login');
  
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Navigating directly to Custom Rules Settings UI...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'custom_rules_ui_before.png' });
  console.log('Saved custom_rules_ui_before.png');

  await browser.close();
})();
