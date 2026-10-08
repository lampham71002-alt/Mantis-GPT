const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TOKEN = 'iLsDvRyiVGzqPBI0hDr2GylGdkMKRmxzrB1gaEAw2yLVMLxZvelX1JJClQw5halYNsGeXqd6U9Lzv0b0gZk2XXpRUGNasfCZP2TvHZP6mcFD6tvMNNHK24G2zymKhNq6843613741791355577';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const FAIL_CASES = [
  { id: 'TC-06R', ruleId: '1572', name: '176 First Stop & test qa Last Stop' },
  { id: 'TC-08R', ruleId: '1574', name: 'test pool Force Tech lam 1 & Call Back Time Window 8-10AM' },
  { id: 'TC-09R', ruleId: '1575', name: 'Initial Service Time Window 12-2PM & Call Back Service Last Stop' },
  { id: 'TC-12R', ruleId: '1578', name: 'Specific test Time Window 1-4PM & test move First Stop' },
  { id: 'TC-13R', ruleId: '1579', name: 'lam minh First Stop & location Time Window 11AM-2PM' }
];

async function setRuleStatusWithRetry(ruleId, status, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', token: TOKEN },
        body: JSON.stringify({ status }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) return;
    } catch (e) {
      console.log(`Lỗi gọi API status (thử lần ${i+1}/${retries}): ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

(async () => {
  console.log('======================================================================');
  console.log('   RECORDING VIDEO TỪNG CASE FAIL CHO BATCH 2 (5 CASES)');
  console.log('   Acc: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   CHU TRÌNH 4 BƯỚC KHÉP KÍN TRÊN LIVE PREVIEW CHROMIUM');
  console.log('======================================================================\n');

  const videoBaseDir = path.resolve(__dirname, '../reports/videos_fail_cases');

  for (let i = 0; i < FAIL_CASES.length; i++) {
    const tc = FAIL_CASES[i];
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`>>> BẮT ĐẦU RECORD VIDEO [${tc.id}] (Rule ${tc.ruleId}): ${tc.name}`);
    console.log(`----------------------------------------------------------------------`);

    const browser = await chromium.launch({
      headless: false,
      slowMo: 200,
      args: ['--window-position=920,0', '--window-size=1000,1040']
    });

    const context = await browser.newContext({
      viewport: { width: 980, height: 960 },
      recordVideo: {
        dir: videoBaseDir,
        size: { width: 980, height: 960 }
      }
    });

    const page = await context.newPage();

    console.log(`1. Đăng nhập vào GDesk...`);
    await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('input');
    const inputs = await page.$$('input');
    await inputs[0].fill('lam.pham@gmail.com');
    await inputs[1].fill('Ahihi123');
    await inputs[1].press('Enter');
    await page.waitForTimeout(5000);

    // Bước 1: Custom Rules -> Bật ON
    console.log(`2. [Bước 1] Custom Rules: BẬT TOGGLE ON Rule ${tc.ruleId}...`);
    await setRuleStatusWithRetry(tc.ruleId, 1);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Bước 2: Sandbox -> Chờ Solver tối ưu 12s
    console.log(`3. [Bước 2] Sandbox: Chờ Solver tối ưu hóa 12s...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);

    // Bước 3: Calendar đối chiếu
    console.log(`4. [Bước 3] Calendar: Đối chiếu với lịch hiện tại...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Bước 4: Tắt Rule về OFF an toàn
    console.log(`5. [Bước 4] Custom Rules: TẮT RULE ${tc.ruleId} về OFF an toàn...`);
    await setRuleStatusWithRetry(tc.ruleId, 0);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log(`6. Đang lưu video cho ${tc.id}...`);
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const origPath = await video.path();
      const destPath = path.join(videoBaseDir, `${tc.id}_record_fail.webm`);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      fs.renameSync(origPath, destPath);
      console.log(`🎉 ĐÃ XUẤT VIDEO THÀNH CÔNG: ${destPath}`);
    }
  }

  console.log('\n======================================================================');
  console.log('              HOÀN TẤT RECORD VIDEO CHO TOÀN BỘ 5 CASES FAIL         ');
  console.log('======================================================================\n');
})();
