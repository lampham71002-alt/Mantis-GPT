const { chromium } = require('playwright');
const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';

(async () => {
  console.log('=== KHOI DONG LIVE PREVIEW TRUC TIEP TREN PANEL BEN PHAI (NON-HEADLESS) ===');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  // Đăng nhập
  console.log('Dang nhap he thong live tai r2.gdesk.io...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // ==========================================
  // TEST CASE: COMBINED 2-ACTIONS (time_window 8AM-10AM + first_stop)
  // ==========================================
  console.log('\n>>> BAT DAU TEST CASE: time_window (8AM-10AM) + first_stop');

  // Bước 1: Ghi nhận Calendar trước khi test
  console.log('[Buoc 1] Mo Calendar ghi nhan vi tri job ban dau...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/calendar?schedules=31', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'scratch/live_tc1_calendar_before.png' });

  // Bước 2: Tạo rule thật qua luồng đối thoại đầy đủ (Multi-turn -> Verify)
  console.log('[Buoc 2] Gui prompt hop le qua AI NLP Engine...');
  const res1 = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({ message: 'Jobs assigned to customer Messi must start between 8:00 AM and 10:00 AM and must be the first stop of the day', conversation_id: null })
  });
  const text1 = await res1.text();
  let convId = null;
  let logic = null;
  for (const line of text1.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.conversation_id) convId = obj.conversation_id;
      if (obj.type === 'executable_logic') logic = obj.value;
    } catch(e){}
  }

  // Nếu AI hỏi thêm thông tin, gửi tiếp lượt 2
  if (!logic && convId) {
    console.log('[Buoc 2.1] AI yeu cau lam ro, gui tiep luot 2: strict, all service types...');
    const res2 = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': TOKEN },
      body: JSON.stringify({ message: 'strict, apply to all service types', conversation_id: convId })
    });
    const text2 = await res2.text();
    for (const line of text2.split('\n')) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'executable_logic') logic = obj.value;
      } catch(e){}
    }
  }

  let createdRuleId = null;
  if (logic && convId) {
    console.log('[Buoc 2.2] Goi /verify de luu rule that vao Database...');
    const vRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': TOKEN },
      body: JSON.stringify({ executable_logic: logic, conversation_id: convId })
    });
    const vData = await vRes.json();
    console.log('Ket qua Verify:', JSON.stringify(vData));
  }

  // Bước 3: Mở trang Custom Rules Settings
  console.log('[Buoc 3] Mo trang Custom Rules de xem va bat toggle...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/live_tc1_settings_before.png' });

  // Bật toggle switch
  console.log('[Buoc 4] Click bat toggle switch ON...');
  await page.mouse.click(405, 218); // Click switch 1
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/live_tc1_toggle_on.png' });

  // Bước 5: Mở Sandbox Grid để kiểm tra và đối chiếu kết quả routing
  console.log('[Buoc 5] Mo Sandbox Grid de quan sat routing thuc te...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'scratch/live_tc1_sandbox_result.png' });

  // Bước 6: Tắt toggle switch để bảo vệ dữ liệu
  console.log('[Buoc 6] Quay lai Custom Rules tat toggle switch OFF...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/settings/custom', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.mouse.click(405, 218); // Click switch 1 de OFF
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/live_tc1_toggle_off.png' });

  console.log('\n=== LIVE PREVIEW TEST HOAN TAT! DANG GIU MAN HINH 60S CHO USER XEM ===');
  await page.waitForTimeout(60000);
  await browser.close();
})();
