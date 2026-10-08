const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TOKEN = 'iLsDvRyiVGzqPBI0hDr2GylGdkMKRmxzrB1gaEAw2yLVMLxZvelX1JJClQw5halYNsGeXqd6U9Lzv0b0gZk2XXpRUGNasfCZP2TvHZP6mcFD6tvMNNHK24G2zymKhNq6843613741791355577';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const RULE_ID = '1550';

async function setRuleStatus(ruleId, status) {
  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({ status })
  });
}

async function fetchSandboxEvents() {
  const url = `${BASE_URL}/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=249,261,270,276,279&start=2026-10-04T00%3A00%3A00.000Z`;
  const res = await fetch(url, { headers: { token: TOKEN } });
  const rawText = await res.text();
  const lines = rawText.split('\n').filter(l => l.trim());
  let finalEvents = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'events' && Array.isArray(parsed.items)) {
        finalEvents = parsed.items;
      }
    } catch(e) {}
  }
  return finalEvents;
}

(async () => {
  console.log('======================================================================');
  console.log('   RECORDING VIDEO CHO TEST CASE 2 (TC-02R)');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('======================================================================\n');

  const videoDir = path.resolve(__dirname, '../reports/videos');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({
    viewport: { width: 980, height: 960 },
    recordVideo: {
      dir: videoDir,
      size: { width: 980, height: 960 }
    }
  });

  const page = await context.newPage();

  console.log('1. Đăng nhập vào GDesk...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // BƯỚC 1: Bật ON Rule 1550
  console.log('2. [Bước 1] Custom Rules: Bật TOGGLE ON Rule 1550...');
  await setRuleStatus(RULE_ID, 1);
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // BƯỚC 2: Mở Sandbox và chờ Solver hội tụ
  console.log('3. [Bước 2] Sandbox: Chờ Solver tối ưu hóa 14s...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000);

  // BƯỚC 3: Mở Calendar đối chiếu
  console.log('4. [Bước 3] Calendar: Đối chiếu với lịch gốc...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // BƯỚC 4: Tắt Rule về OFF
  console.log('5. [Bước 4] Custom Rules: TẮT RULE 1550 về OFF...');
  await setRuleStatus(RULE_ID, 0);
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('6. Hoàn tất chu trình. Đang lưu file video...');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const finalVideoName = path.join(videoDir, 'TC-02R_record_case2.webm');
    if (fs.existsSync(finalVideoName)) fs.unlinkSync(finalVideoName);
    fs.renameSync(videoPath, finalVideoName);
    console.log(`\n🎉 ĐÃ RECORD VIDEO THÀNH CÔNG: ${finalVideoName}`);
  }
})();
