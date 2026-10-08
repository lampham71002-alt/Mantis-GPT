const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TOKEN = 'yPmjy9V05HwKj5I0oeyDRhIWErBbhgMJSeT5FwKi5mXV30zWPfC0G5CkzndmkduflRkaI5aKXtDeJHdMoHuN4ybe6KykKlTIq8TErXEMIYeOQuvIxk0pa3pExCj07Yf6843613741791423573';
const BRANCH = 'GD1LK8RC5OH0';

(async () => {
  const videoDir = path.resolve(__dirname, '../reports/videos_proof');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({
    viewport: { width: 980, height: 960 },
    recordVideo: { dir: videoDir, size: { width: 980, height: 960 } }
  });

  const page = await context.newPage();

  console.log('1. Đang truy cập login...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // 1. Mở Sandbox khi Baseline (Rule 1649 đang OFF)
  console.log('2. Mở Sandbox khi CHƯA CÓ RULE (Baseline ban đầu)...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // 2. Bật Toggle ON Rule 1649
  console.log('3. Bật TOGGLE ON Rule 1649 (test 1 First Stop & test qa Last Stop)...');
  await fetch(`https://apiv2.gdesk.io/api/routing/mantis/custom-rules/1649/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({ status: 1 })
  });
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 3. Mở Sandbox để Solver đảo lịch trực tiếp trên video
  console.log('4. Mở Sandbox xem Solver tối ưu đảo toàn bộ thứ tự dừng...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(14000);

  // 4. Tắt Rule 1649 về OFF an toàn
  console.log('5. Tắt Rule 1649 về OFF an toàn...');
  await fetch(`https://apiv2.gdesk.io/api/routing/mantis/custom-rules/1649/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({ status: 0 })
  });
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  console.log('6. Hoàn tất quá trình record.');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const origPath = await video.path();
    const destPath = path.join(videoDir, 'PROVE_REAL_SOLVER_DELTA.webm');
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    fs.renameSync(origPath, destPath);
    console.log('🎉 ĐÃ XUẤT VIDEO CHỨNG MINH THÀNH CÔNG:', destPath);
  }
})();
