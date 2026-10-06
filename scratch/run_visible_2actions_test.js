const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('=== CHAY TEST KET HOP 2 ACTIONS (HIEN THI MAN HINH KE BEN) ===');
  
  // Mo trinh duyet o nua phai man hinh cho user xem truc tiep
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200, // Chậm lại để người dùng xem rõ từng thao tác
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  // 1. Dang nhap
  console.log('[1/6] Dang nhap tai khoan lamlam@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // 2. Mo Calendar chinh goc (Ghi nhan trang thai ban dau)
  console.log('[2/6] Mo Calendar chinh goc de xem job ban dau...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'test_step1_calendar_original.png' });

  // 3. Vao Custom Rules settings
  console.log('[3/6] Vao trang Custom Rules de kiem tra toggle...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // 4. Bat Toggle Custom Rule ON
  console.log('[4/6] Bat Toggle Rule ON tren giao dien...');
  await page.mouse.click(405, 218); // Click toggle 1
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'test_step2_toggle_on.png' });

  // 5. Vao Sandbox Grid de doi chieu voi Calendar
  console.log('[5/6] Vao Sandbox Grid de doi chieu job so voi Calendar...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'test_step3_sandbox_applied.png' });

  // 6. Tat Toggle OFF lai cho an toan
  console.log('[6/6] Tat Toggle OFF de giu an toan du lieu...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(3000);

  console.log('=== HOAN TAT TEST TRUC QUAN TRREN MAN HINH ===');
  await browser.close();
})();
