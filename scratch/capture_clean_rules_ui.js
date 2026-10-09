const { chromium } = require('playwright');
const path = require('path');

async function captureCleanUI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/mantis/settings/specific', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const screenshotPath = path.join(__dirname, '..', 'reports', 'specific_rules_1610_clean_ui.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Đã lưu ảnh chụp UI sạch tại: ${screenshotPath}`);

  await browser.close();
}

captureCleanUI().catch(console.error);
