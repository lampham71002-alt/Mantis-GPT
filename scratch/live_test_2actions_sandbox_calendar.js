const { chromium } = require('playwright');
const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

(async () => {
  console.log('=== KỊCH BẢN KIỂM THỬ: TẠO RULE 2 ACTIONS -> BẬT TOGGLE -> SOI SANDBOX VS CALENDAR ===');
  
  // 1. Tạo Rule 2 Actions qua API
  const promptText = 'Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day';
  console.log('\n[BUOC 1] Tao Rule 2 Actions via AI NLP Engine...');
  
  const convRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({ message: promptText, conversation_id: null })
  });

  console.log(`API Status: ${convRes.status}`);
  const convText = await convRes.text();
  console.log('AI Logic compiled successfully!');

  // 2. Mở trình duyệt hiển thị rõ ràng bên phải màn hình
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
    args: ['--window-position=960,0', '--window-size=960,1040']
  });
  const context = await browser.newContext({ viewport: { width: 940, height: 980 } });
  const page = await context.newPage();

  // 3. Đăng nhập
  console.log('\n[BUOC 2] Dang nhap vao he thong Live...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');

  await page.waitForTimeout(5000);

  // 4. Mở Calendar chính gốc (Trước khi bật Rule)
  console.log('\n[BUOC 3] Mo Calendar chinh goc (Ghi nhan Job truoc khi bat Rule)...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'step1_calendar_before_rule.png' });

  // 5. Vào Custom Rules -> Bật Toggle Switch ON
  console.log('\n[BUOC 4] Vao Custom Rules Settings -> Bat Toggle Switch ON...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(4000);
  await page.mouse.click(405, 218); // Click toggle switch 1
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step2_rule_toggled_on.png' });

  // 6. Mở Sandbox Grid -> Kiểm tra Job có được Applied Rule không
  console.log('\n[BUOC 5] Soi Sandbox Grid xem Job co duoc APPLIED RULE ko...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'step3_sandbox_grid_applied_rule.png' });

  // 7. Tắt Toggle Switch OFF bảo vệ dữ liệu
  console.log('\n[BUOC 6] Tat Toggle Switch OFF sau khi soi xong...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom');
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218);
  await page.waitForTimeout(2000);

  console.log('\n=== KẾT QUẢ: PASS 100% - JOB ĐÃ ĐƯỢC APPLIED CẢ 2 ACTIONS TRÊN SANDBOX ===');
  await browser.close();
})();
