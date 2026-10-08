const { chromium } = require('playwright');
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
  console.log('   TEST LẠI RIÊNG TEST CASE 2 (TC-02R) TRÊN ACC: lam.pham@gmail.com');
  console.log('   Nội dung: test move First Stop + Quarterly Service Time Window (9AM-12PM)');
  console.log('   CHU TRÌNH 4 BƯỚC KHÉP KÍN TRÊN LIVE PREVIEW');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  console.log('Đang đăng nhập lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  // Bước 1: Custom Rules -> Bật ON Rule 1550
  console.log('[Bước 1] Custom Rules: BẬT TOGGLE ON Rule 1550...');
  await setRuleStatus(RULE_ID, 1);
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'reports/screenshots_rerun/TC-02R_step1_rule_on.png' });

  // Bước 2: Sandbox -> Đợi Solver hội tụ 12s -> Kiểm tra logic
  console.log('[Bước 2] Sandbox: Chờ Solver tối ưu hóa 12s...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'reports/screenshots_rerun/TC-02R_step2_sandbox.png' });

  const allEvents = await fetchSandboxEvents();
  const tmJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('test move'));
  const qJobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('quarterly'));

  let c1 = false, c2 = false, note = '';
  if (tmJobs.length && qJobs.length) {
    const tm = tmJobs[0];
    const tmDayJobs = allEvents.filter(e => e.date_label === tm.date_label && e.schedule?.id === tm.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
    c1 = tmDayJobs[0]?.job?.id === tm.job?.id;
    const qj = qJobs[0];
    const qStart = qj.event?.start || '';
    const qHeader = qj.tile?.header || '';
    c2 = qStart.includes('09:') || qStart.includes('10:') || qStart.includes('11:') || qHeader.includes('9:') || qHeader.includes('10:') || qHeader.includes('11:');
    note = `test move đầu ngày (#1): ${c1 ? 'CÓ' : 'KHÔNG'} | Quarterly giờ: "${qHeader || qStart}"`;
  } else {
    note = 'Không tìm thấy job';
  }

  const verdict = (c1 && c2) ? 'PASS' : 'FAIL';
  console.log(`\n>>> KẾT QUẢ TEST LẠI TC-02R:`);
  console.log(`    Mệnh đề 1 (test move First Stop): ${c1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Mệnh đề 2 (Quarterly 9AM-12PM): ${c2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Chi tiết: ${note}`);
  console.log(`>>> KẾT LUẬN: ${verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Bước 3: Calendar
  console.log('[Bước 3] Calendar: Đối chiếu với lịch gốc...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'reports/screenshots_rerun/TC-02R_step3_calendar.png' });

  // Bước 4: Tắt Toggle về OFF
  console.log('[Bước 4] Custom Rules: TẮT RULE 1550 về OFF an toàn...');
  await setRuleStatus(RULE_ID, 0);
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'reports/screenshots_rerun/TC-02R_step4_rule_off.png' });

  console.log('HOÀN THÀNH TEST LẠI TEST CASE 2!');
  await browser.close();
})();
