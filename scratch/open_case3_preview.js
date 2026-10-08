const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  console.log('Đang đăng nhập...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(4000);

  console.log('Mở Custom Rules hiển thị Rule 1476 (BẬT ON)...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('Chuyển sang Sandbox để hiển thị kết quả tối ưu...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  console.log('Giữ cửa sổ Sandbox mở để bạn trực tiếp kiểm tra và tương tác...');
  // Giữ browser mở
  await new Promise(() => {});
})();
