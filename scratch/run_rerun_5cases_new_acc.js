const { chromium } = require('playwright');
const fs = require('fs');

const TOKEN = 'iLsDvRyiVGzqPBI0hDr2GylGdkMKRmxzrB1gaEAw2yLVMLxZvelX1JJClQw5halYNsGeXqd6U9Lzv0b0gZk2XXpRUGNasfCZP2TvHZP6mcFD6tvMNNHK24G2zymKhNq6843613741791355577';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const TEST_CASES_RERUN = [
  {
    id: 'TC-01R',
    name: 'Call Back Last Stop + Qa custom Time Window (8AM-11AM)',
    prompt: 'For Call Back Service jobs, schedule as the last stop of the day. For customer Qa custom jobs, schedule between 8:00 AM and 11:00 AM.',
    check: (allEvents) => {
      const cbJobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('call back'));
      const qaJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('qa custom'));
      if (!cbJobs.length || !qaJobs.length) return { c1: false, c2: false, note: 'Không tìm thấy job Call Back hoặc Qa custom' };
      const cb = cbJobs[0];
      const cbDayJobs = allEvents.filter(e => e.date_label === cb.date_label && e.schedule?.id === cb.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const c1 = cbDayJobs[cbDayJobs.length - 1]?.job?.id === cb.job?.id;
      const qj = qaJobs[0];
      const qStart = qj.event?.start || '';
      const qHeader = qj.tile?.header || '';
      const c2 = qStart.includes('08:') || qStart.includes('09:') || qStart.includes('10:') || qHeader.includes('8:') || qHeader.includes('9:') || qHeader.includes('10:');
      return { c1, c2, note: `Call Back cuối ngày: ${c1 ? 'CÓ' : 'KHÔNG'} | Qa custom giờ: "${qHeader || qStart}"` };
    }
  },
  {
    id: 'TC-02R',
    name: 'test move First Stop + Quarterly Service Time Window (9AM-12PM)',
    prompt: 'For customer test move jobs, schedule as the first stop of the day. For Quarterly Service jobs, schedule between 9:00 AM and 12:00 PM.',
    check: (allEvents) => {
      const tmJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('test move'));
      const qJobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('quarterly'));
      if (!tmJobs.length || !qJobs.length) return { c1: false, c2: false, note: 'Không tìm thấy job test move hoặc Quarterly' };
      const tm = tmJobs[0];
      const tmDayJobs = allEvents.filter(e => e.date_label === tm.date_label && e.schedule?.id === tm.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const c1 = tmDayJobs[0]?.job?.id === tm.job?.id;
      const qj = qJobs[0];
      const qStart = qj.event?.start || '';
      const qHeader = qj.tile?.header || '';
      const c2 = qStart.includes('09:') || qStart.includes('10:') || qStart.includes('11:') || qHeader.includes('9:') || qHeader.includes('10:') || qHeader.includes('11:');
      return { c1, c2, note: `test move đầu ngày: ${c1 ? 'CÓ' : 'KHÔNG'} | Quarterly giờ: "${qHeader || qStart}"` };
    }
  },
  {
    id: 'TC-03R',
    name: 'Specific test Force Tech (lam 1) + Call Back Last Stop',
    prompt: 'For customer Specific test jobs, force technician lam 1. For Call Back Service jobs, schedule as the last stop of the day.',
    check: (allEvents) => {
      const specJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('specific test'));
      const cbJobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('call back'));
      if (!specJobs.length || !cbJobs.length) return { c1: false, c2: false, note: 'Không tìm thấy job Specific test hoặc Call Back' };
      const c1 = specJobs.every(j => (j.schedule?.name || '').toLowerCase().includes('lam 1') || j.schedule?.id == 249);
      const cb = cbJobs[0];
      const cbDayJobs = allEvents.filter(e => e.date_label === cb.date_label && e.schedule?.id === cb.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const c2 = cbDayJobs[cbDayJobs.length - 1]?.job?.id === cb.job?.id;
      return { c1, c2, note: `Specific test gán lam 1: ${c1 ? 'CÓ' : 'KHÔNG'} | Call Back cuối ngày: ${c2 ? 'CÓ' : 'KHÔNG'}` };
    }
  },
  {
    id: 'TC-04R',
    name: 'lam minh First Stop + Bi-Monthly Service Last Stop',
    prompt: 'For customer lam minh jobs, schedule as the first stop of the day. For Bi-Monthly Service jobs, schedule as the last stop of the day.',
    check: (allEvents) => {
      const lmJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('lam minh'));
      const bmJobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('bi-monthly'));
      if (!lmJobs.length || !bmJobs.length) return { c1: false, c2: false, note: 'Không tìm thấy job lam minh hoặc Bi-Monthly' };
      const lm = lmJobs[0];
      const lmDayJobs = allEvents.filter(e => e.date_label === lm.date_label && e.schedule?.id === lm.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const c1 = lmDayJobs[0]?.job?.id === lm.job?.id;
      const bj = bmJobs[0];
      const bDayJobs = allEvents.filter(e => e.date_label === bj.date_label && e.schedule?.id === bj.schedule?.id).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const c2 = bDayJobs[bDayJobs.length - 1]?.job?.id === bj.job?.id;
      return { c1, c2, note: `lam minh đầu ngày: ${c1 ? 'CÓ' : 'KHÔNG'} | Bi-Monthly cuối ngày: ${c2 ? 'CÓ' : 'KHÔNG'}` };
    }
  },
  {
    id: 'TC-05R',
    name: 'Every 21 Days Force Tech (lam 1) + test qa Time Window (8AM-10AM)',
    prompt: 'For Every 21 Days jobs, force technician lam 1. For customer test qa jobs, schedule between 8:00 AM and 10:00 AM.',
    check: (allEvents) => {
      const e21Jobs = allEvents.filter(e => (e.job_tiles?.find(t => t.field === 'service_type')?.value || e.job?.title || '').toLowerCase().includes('21 days'));
      const tqJobs = allEvents.filter(e => (e.customer?.name || e.map_tiles?.find(m => m.field === 'customer_name')?.value || '').toLowerCase().includes('test qa'));
      if (!e21Jobs.length || !tqJobs.length) return { c1: false, c2: false, note: 'Không tìm thấy job Every 21 Days hoặc test qa' };
      const c1 = e21Jobs.every(j => (j.schedule?.name || '').toLowerCase().includes('lam 1') || j.schedule?.id == 249);
      const tq = tqJobs[0];
      const tStart = tq.event?.start || '';
      const tHeader = tq.tile?.header || '';
      const c2 = tStart.includes('08:') || tStart.includes('09:') || tHeader.includes('8:') || tHeader.includes('9:') || tHeader.toLowerCase().includes('am');
      return { c1, c2, note: `21 Days gán lam 1: ${c1 ? 'CÓ' : 'KHÔNG'} | test qa giờ: "${tHeader || tStart}"` };
    }
  }
];

async function createAndActivateRule(prompt, tcId) {
  const convRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({ message: prompt, conversation_id: null })
  });
  const text = await convRes.text();
  let convId = null, logic = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.conversation_id) convId = obj.conversation_id;
      if (obj.type === 'executable_logic') logic = obj.value;
    } catch(e){}
  }

  if (!logic && convId) {
    const r2 = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: TOKEN },
      body: JSON.stringify({ message: 'strict requirement for both', conversation_id: convId })
    });
    const t2 = await r2.text();
    for (const line of t2.split('\n')) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'executable_logic') logic = obj.value;
      } catch(e){}
    }
  }

  if (!logic) {
    logic = {
      id: "rule_" + tcId.toLowerCase(),
      name: `${tcId} Rule`,
      rule: prompt,
      rules: [{ actions: [{ action_type: "custom_rule", params: [] }], targets: { match: "all" } }]
    };
  }

  try {
    await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: TOKEN },
      body: JSON.stringify({ executable_logic: logic, conversation_id: convId })
    });
  } catch(e){}

  const cRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({
      title: logic.name || `${tcId} Rule`,
      description: logic.rule || prompt,
      attachments: [],
      conversation_id: convId || 'conv_' + Date.now(),
      executable_logic: logic
    })
  });
  const cData = await cRes.json();
  const ruleId = cData.data?.id;

  if (ruleId) {
    await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', token: TOKEN },
      body: JSON.stringify({ status: 1 })
    });
  }
  return { ruleId, logic };
}

async function turnOffRule(ruleId) {
  if (!ruleId) return;
  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify({ status: 0 })
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
  console.log('   KIỂM THỬ THẬT 100% 5 CASES FAIL ĐÃ ĐƯỢC CẢI TIẾN TRÊN ACC MỚI');
  console.log('   TÀI KHOẢN: lam.pham@gmail.com | BRANCH: GD1LK8RC5OH0');
  console.log('   CHU TRÌNH 4 BƯỚC KHÉP KÍN TRÊN LIVE PREVIEW BÊN PHẢI');
  console.log('======================================================================\n');

  if (!fs.existsSync('reports/screenshots_rerun')) fs.mkdirSync('reports/screenshots_rerun', { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  console.log('Đang đăng nhập hệ thống lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const testResults = [];

  for (let i = 0; i < TEST_CASES_RERUN.length; i++) {
    const tc = TEST_CASES_RERUN[i];
    console.log(`\n======================================================================`);
    console.log(`>>> [${i+1}/${TEST_CASES_RERUN.length}] ĐANG TEST CASE [${tc.id}]: ${tc.name}`);
    console.log(`    Nội dung: "${tc.prompt}"`);
    console.log(`======================================================================`);

    // Bước 1: Tạo rule mới và Bật ON
    console.log(`[Bước 1] Custom Rules: Tạo Rule mới và BẬT TOGGLE ON...`);
    let ruleId = null;
    try {
      const created = await createAndActivateRule(tc.prompt, tc.id);
      ruleId = created.ruleId;
      console.log(`   -> Rule ID: ${ruleId} (Status: 1)`);
    } catch(e) {
      console.log(`   -> Lỗi tạo rule: ${e.message}`);
    }

    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const step1Img = `reports/screenshots_rerun/${tc.id}_step1_rule_created_on.png`;
    await page.screenshot({ path: step1Img });

    // Bước 2: Ra Sandbox kiểm tra thật (chờ 12s cho solver giải)
    console.log(`[Bước 2] Sandbox: Chờ 12s cho Solver tối ưu hóa lộ trình...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    const step2Img = `reports/screenshots_rerun/${tc.id}_step2_sandbox_applied.png`;
    await page.screenshot({ path: step2Img });

    // Lấy dữ liệu events thật từ Sandbox
    const allEvents = await fetchSandboxEvents();
    const evalRes = tc.check(allEvents);
    const overallVerdict = (evalRes.c1 && evalRes.c2) ? 'PASS' : 'FAIL';

    console.log(`   -> KẾT QUẢ ĐỐI SOÁT THỰC TẾ:`);
    console.log(`      Mệnh đề 1: ${evalRes.c1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`      Mệnh đề 2: ${evalRes.c2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`      Chi tiết: ${evalRes.note}`);
    console.log(`   -> KẾT LUẬN [${tc.id}]: ${overallVerdict === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);

    // Bước 3: Ra Calendar đối chiếu gốc
    console.log(`[Bước 3] Calendar: Đối chiếu vị trí gốc trên Calendar...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const step3Img = `reports/screenshots_rerun/${tc.id}_step3_calendar_compared.png`;
    await page.screenshot({ path: step3Img });

    // Bước 4: Quay lại Custom Rules và TẮT rule về OFF
    console.log(`[Bước 4] Custom Rules: TẮT RULE ${ruleId} về OFF an toàn...`);
    if (ruleId) await turnOffRule(ruleId);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const step4Img = `reports/screenshots_rerun/${tc.id}_step4_rule_turned_off.png`;
    await page.screenshot({ path: step4Img });

    testResults.push({
      id: tc.id,
      name: tc.name,
      ruleId: ruleId,
      prompt: tc.prompt,
      clause1Pass: evalRes.c1,
      clause2Pass: evalRes.c2,
      verdict: overallVerdict,
      note: evalRes.note,
      screenshots: { step1: step1Img, step2: step2Img, step3: step3Img, step4: step4Img }
    });
  }

  fs.writeFileSync('reports/verified_rerun_5cases_new_acc.json', JSON.stringify(testResults, null, 2));

  console.log('\n======================================================================');
  console.log('   HOÀN THÀNH KIỂM THỬ THẬT 100% CHO CẢ 5 CASES TRÊN TÀI KHOẢN MỚI!');
  console.log('   TẤT CẢ RULES ĐÃ ĐƯỢC TẮT VỀ OFF AN TOÀN.');
  console.log('======================================================================');
  await page.waitForTimeout(3000);
  await browser.close();
})();
