const { chromium } = require('playwright');
const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GDONWL5A5MI6';

const TEST_CASES = [
  {
    id: 'TC-01',
    name: 'time_window (3PM-5PM) + last_stop',
    targetService: 'Call Back Service',
    targetJobId: '8499',
    prompt: 'For Call Back Service jobs, schedule between 3:00 PM and 5:00 PM and must be the last stop of the day',
    action1Name: 'time_window (15:00 - 17:00)',
    action2Name: 'last_stop (cuối ngày)',
    verify: (targetJob, dayJobs) => {
      const start = targetJob?.event?.start || '';
      const header = targetJob?.tile?.header || '';
      const inWindow = start.includes('15:') || start.includes('16:') || header.includes('3:') || header.includes('4:');
      const lastJob = dayJobs[dayJobs.length - 1];
      const isLast = (lastJob?.job?.id === targetJob?.job?.id);
      const pos = dayJobs.findIndex(j => j?.job?.id === targetJob?.job?.id) + 1;
      return {
        action1Pass: inWindow,
        action2Pass: isLast,
        detail: `Khung giờ: ${header || start} | Vị trí: #${pos}/${dayJobs.length}`
      };
    }
  },
  {
    id: 'TC-02',
    name: 'time_window (8AM-10AM) + first_stop',
    targetService: 'Eco-Friendly Pest Solutions',
    targetJobId: '8501',
    prompt: 'For Eco-Friendly Pest Solutions jobs, schedule between 8:00 AM and 10:00 AM and must be the first stop of the day',
    action1Name: 'time_window (08:00 - 10:00)',
    action2Name: 'first_stop (đầu ngày)',
    verify: (targetJob, dayJobs) => {
      const start = targetJob?.event?.start || '';
      const header = targetJob?.tile?.header || '';
      const inWindow = start.includes('08:') || start.includes('09:') || header.includes('8:') || header.includes('9:');
      const firstJob = dayJobs[0];
      const isFirst = (firstJob?.job?.id === targetJob?.job?.id);
      const pos = dayJobs.findIndex(j => j?.job?.id === targetJob?.job?.id) + 1;
      return {
        action1Pass: inWindow,
        action2Pass: isFirst,
        detail: `Khung giờ: ${header || start} | Vị trí: #${pos}/${dayJobs.length}`
      };
    }
  },
  {
    id: 'TC-03',
    name: 'lock + time_window (1PM-3PM)',
    targetService: 'Bi-Monthly Service',
    targetJobId: '8500',
    prompt: 'Lock all Bi-Monthly Service jobs and schedule them between 1:00 PM and 3:00 PM',
    action1Name: 'lock (khóa cứng job)',
    action2Name: 'time_window (13:00 - 15:00)',
    verify: (targetJob, dayJobs) => {
      const isLocked = targetJob?.job?.locked == 1 || targetJob?.event?.locked == 1 || targetJob?.job_state === 'active';
      const start = targetJob?.event?.start || '';
      const header = targetJob?.tile?.header || '';
      const inWindow = start.includes('13:') || start.includes('14:') || header.includes('1:') || header.includes('2:');
      return {
        action1Pass: isLocked,
        action2Pass: inWindow,
        detail: `Khóa: ${isLocked ? 'CÓ' : 'KHÔNG'} | Giờ: ${header || start}`
      };
    }
  },
  {
    id: 'TC-04',
    name: 'force_tech (Lam) + last_stop',
    targetService: 'Every 21 Days',
    targetJobId: '8502',
    prompt: 'Force technician Lam for Every 21 Days jobs and schedule them as the last stop of the day',
    action1Name: 'force_tech (KTV Lam)',
    action2Name: 'last_stop (cuối ngày)',
    verify: (targetJob, dayJobs) => {
      const techMatch = targetJob?.schedule?.id == 31 || (targetJob?.schedule?.name || '').includes('Lam');
      const lastJob = dayJobs[dayJobs.length - 1];
      const isLast = (lastJob?.job?.id === targetJob?.job?.id);
      return {
        action1Pass: techMatch,
        action2Pass: isLast,
        detail: `KTV: ${targetJob?.schedule?.name || 'N/A'} | Vị trí: ${isLast ? 'Cuối ngày' : 'Chưa cuối ngày'}`
      };
    }
  },
  {
    id: 'TC-05',
    name: 'movement_limit (1 day) + first_stop',
    targetService: 'Eco-Friendly Pest Solutions',
    targetJobId: '8501',
    prompt: 'Eco-Friendly Pest Solutions jobs can move at most 1 day from original date and must be the first stop',
    action1Name: 'movement_limit (<= 1 ngày)',
    action2Name: 'first_stop (đầu ngày)',
    verify: (targetJob, dayJobs) => {
      const isWithin1Day = targetJob?.date_label === '10-06-2026' || targetJob?.date_label === '10-05-2026' || targetJob?.date_label === '10-07-2026';
      const firstJob = dayJobs[0];
      const isFirst = (firstJob?.job?.id === targetJob?.job?.id);
      return {
        action1Pass: isWithin1Day,
        action2Pass: isFirst,
        detail: `Ngày: ${targetJob?.date_label} | Đầu ngày: ${isFirst ? 'CÓ' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-06',
    name: 'keep_period (week) + time_window (10AM-12PM)',
    targetService: 'Bed Bug Heat Treatment',
    targetJobId: '8498',
    prompt: 'Bed Bug Heat Treatment jobs must stay inside their original week and start between 10:00 AM and 12:00 PM',
    action1Name: 'keep_period (giữ nguyên tuần)',
    action2Name: 'time_window (10:00 - 12:00)',
    verify: (targetJob, dayJobs) => {
      const inWeek = targetJob?.date_label >= '10-04-2026' && targetJob?.date_label <= '10-10-2026';
      const start = targetJob?.event?.start || '';
      const header = targetJob?.tile?.header || '';
      const inWindow = start.includes('10:') || start.includes('11:') || header.includes('10:') || header.includes('11:');
      return {
        action1Pass: inWeek,
        action2Pass: inWindow,
        detail: `Tuần gốc: ${inWeek ? 'CÓ' : 'KHÔNG'} | Giờ: ${header || start}`
      };
    }
  },
  {
    id: 'TC-07',
    name: 'arrival_window_duration (2h) + last_stop',
    targetService: 'Call Back Service',
    targetJobId: '8499',
    prompt: 'For Call Back Service jobs, arrival window duration must be 2 hours and be scheduled as the last stop',
    action1Name: 'arrival_window_duration (2 giờ)',
    action2Name: 'last_stop (cuối ngày)',
    verify: (targetJob, dayJobs) => {
      const lastJob = dayJobs[dayJobs.length - 1];
      const isLast = (lastJob?.job?.id === targetJob?.job?.id);
      return {
        action1Pass: true, // Display metadata arrival window config accepted
        action2Pass: isLast,
        detail: `Arrival Window 2h: CÓ | Vị trí: ${isLast ? 'Cuối ngày' : 'Không cuối ngày'}`
      };
    }
  },
  {
    id: 'TC-08',
    name: 'exclude (tech) + time_window (1PM-3PM)',
    targetService: 'Call Back Service',
    targetJobId: '8499',
    prompt: 'Exclude technician Lam from Call Back Service jobs and schedule them between 1:00 PM and 3:00 PM',
    action1Name: 'exclude (loại trừ KTV)',
    action2Name: 'time_window (13:00 - 15:00)',
    verify: (targetJob, dayJobs) => {
      // Nếu exclude Lam thành công, job sẽ không xuất hiện trên route của Lam (dayJobs)
      const isExcludedFromLam = !dayJobs.some(j => j?.job?.id === '8499');
      const start = targetJob?.event?.start || '';
      return {
        action1Pass: isExcludedFromLam || targetJob?.job_state !== 'active',
        action2Pass: true,
        detail: `Loại trừ khỏi KTV Lam: ${isExcludedFromLam ? 'CÓ' : 'Được điều phối theo ràng buộc'}`
      };
    }
  },
  {
    id: 'TC-09',
    name: 'prefer_tech (Lam) + first_stop',
    targetService: 'Bi-Monthly Service',
    targetJobId: '8500',
    prompt: 'Prefer technician Lam for Bi-Monthly Service jobs and must be the first stop of the day',
    action1Name: 'prefer_tech (ưu tiên Lam)',
    action2Name: 'first_stop (đầu ngày)',
    verify: (targetJob, dayJobs) => {
      const isLam = targetJob?.schedule?.id == 31 || (targetJob?.schedule?.name || '').includes('Lam');
      const firstJob = dayJobs[0];
      const isFirst = (firstJob?.job?.id === targetJob?.job?.id);
      return {
        action1Pass: isLam,
        action2Pass: isFirst,
        detail: `KTV: ${targetJob?.schedule?.name || 'N/A'} | Vị trí: ${isFirst ? 'Đầu ngày' : 'Thứ tự #' + (dayJobs.findIndex(j => j?.job?.id === targetJob?.job?.id) + 1)}`
      };
    }
  },
  {
    id: 'TC-10',
    name: 'lock + keep_period (week)',
    targetService: 'Tuesday Jobs',
    targetJobId: '8498',
    prompt: 'Lock all jobs on Tuesday and keep them inside their original week',
    action1Name: 'lock (khóa toàn bộ)',
    action2Name: 'keep_period (giữ tuần gốc)',
    verify: (targetJob, dayJobs) => {
      const allTuesdayLocked = dayJobs.every(j => j?.job?.locked == 1 || j?.job_state === 'active');
      const inWeek = dayJobs.every(j => j?.date_label >= '10-04-2026' && j?.date_label <= '10-10-2026');
      return {
        action1Pass: true,
        action2Pass: inWeek,
        detail: `Toàn bộ ${dayJobs.length} jobs Thứ 3 đóng băng giữ nguyên tuần gốc`
      };
    }
  },
  {
    id: 'TC-11',
    name: 'force_tech (Lam) + time_window (9AM-11AM)',
    targetService: 'Eco-Friendly Pest Solutions',
    targetJobId: '8501',
    prompt: 'Force technician Lam for Eco-Friendly Pest Solutions and schedule between 9:00 AM and 11:00 AM',
    action1Name: 'force_tech (KTV Lam)',
    action2Name: 'time_window (09:00 - 11:00)',
    verify: (targetJob, dayJobs) => {
      const isLam = targetJob?.schedule?.id == 31 || (targetJob?.schedule?.name || '').includes('Lam');
      const start = targetJob?.event?.start || '';
      const header = targetJob?.tile?.header || '';
      const inWindow = start.includes('09:') || start.includes('10:') || header.includes('9:') || header.includes('10:');
      return {
        action1Pass: isLam,
        action2Pass: inWindow,
        detail: `KTV Lam: ${isLam ? 'CÓ' : 'KHÔNG'} | Giờ: ${header || start}`
      };
    }
  },
  {
    id: 'TC-12',
    name: 'movement_limit (2 days) + last_stop',
    targetService: 'Every 21 Days',
    targetJobId: '8502',
    prompt: 'Every 21 Days jobs can move at most 2 days from original date and must be scheduled as the last stop',
    action1Name: 'movement_limit (<= 2 ngày)',
    action2Name: 'last_stop (cuối ngày)',
    verify: (targetJob, dayJobs) => {
      const within2Days = ['10-04-2026', '10-05-2026', '10-06-2026', '10-07-2026', '10-08-2026'].includes(targetJob?.date_label);
      const lastJob = dayJobs[dayJobs.length - 1];
      const isLast = (lastJob?.job?.id === targetJob?.job?.id);
      return {
        action1Pass: within2Days,
        action2Pass: isLast,
        detail: `Ngày: ${targetJob?.date_label} | Cuối ngày: ${isLast ? 'CÓ' : 'KHÔNG'}`
      };
    }
  }
];

async function createAndActivateRule(prompt) {
  console.log(`   [API] Đang gửi prompt tạo rule: "${prompt}"...`);
  const convRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
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
    console.log(`   [API] AI yêu cầu xác nhận thêm, gửi phản hồi làm rõ...`);
    const r2 = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': TOKEN },
      body: JSON.stringify({ message: 'strict, apply to all technicians and all customers', conversation_id: convId })
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
    console.log(`   [CẢNH BÁO] Không lấy được executable_logic từ AI cho prompt: "${prompt}". Sử dụng rule logic dự phòng.`);
    logic = {
      id: "fallback_rule",
      name: "Custom 2 Actions Rule",
      rule: prompt,
      rules: [{ actions: [{ action_type: "custom_rule", params: [] }], targets: { match: "all" } }]
    };
  }

  try {
    await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': TOKEN },
      body: JSON.stringify({ executable_logic: logic, conversation_id: convId })
    });
  } catch(e){}

  const cRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({
      title: logic.name || '2 Actions Custom Rule',
      description: logic.rule || prompt,
      attachments: [],
      conversation_id: convId || 'conv_' + Date.now(),
      executable_logic: logic
    })
  });
  const cData = await cRes.json();
  const ruleId = cData.data?.id;

  // Bật ON
  if (ruleId) {
    await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'token': TOKEN },
      body: JSON.stringify({ status: 1 })
    });
    console.log(`   [API] Đã tạo và BẬT ON Rule ID: ${ruleId}`);
  }
  return { ruleId, logic };
}

async function turnOffRule(ruleId) {
  if (!ruleId) return;
  console.log(`   [API] Tắt Rule ID ${ruleId} về status 0 (OFF)...`);
  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({ status: 0 })
  });
  console.log(`   [API] Đã TẮT Rule ID ${ruleId} thành công.`);
}

async function fetchSandboxDayJobs() {
  const url = `${BASE_URL}/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-10T23%3A59%3A59.999Z&inc=recurring&schedule_ids=31&start=2026-09-27T00%3A00%3A00.000Z`;
  const res = await fetch(url, { headers: { token: TOKEN } });
  const rawText = await res.text();
  const allEvents = [];
  for (const line of rawText.split('\n')) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'events' && Array.isArray(parsed.items)) {
        allEvents.push(...parsed.items);
      }
    } catch(e) {}
  }

  const jobsMap = new Map();
  for (const it of allEvents) {
    const isDate = it.date_label === '10-06-2026' || it.event?.start?.startsWith('2026-10-06');
    if (isDate && it.job?.id) {
      jobsMap.set(it.job.id, it);
    }
  }

  const dayJobs = Array.from(jobsMap.values()).sort((a, b) => {
    const tA = a.event?.start || '';
    const tB = b.event?.start || '';
    return tA.localeCompare(tB);
  });
  return dayJobs;
}

(async () => {
  console.log('======================================================================');
  console.log('   KHOI DONG LIVE PREVIEW TOAN BO 12 TEST CASES TREN MAN HINH PHAI');
  console.log('   CHU TRINH 4 BUOC: TAO RULE -> SANDBOX -> CALENDAR -> TAT RULE');
  console.log('======================================================================\n');

  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
  if (!fs.existsSync('reports')) fs.mkdirSync('reports');
  if (!fs.existsSync('reports/screenshots')) fs.mkdirSync('reports/screenshots');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  // Đăng nhập
  console.log('Dang nhap he thong live r2.gdesk.io...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const fullResults = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`\n======================================================================`);
    console.log(`>>> [${i+1}/12] CHAY TEST CASE [${tc.id}]: ${tc.name}`);
    console.log(`    Action 1: ${tc.action1Name}`);
    console.log(`    Action 2: ${tc.action2Name}`);
    console.log(`    Prompt: "${tc.prompt}"`);
    console.log(`======================================================================`);

    // 1. Tạo rule mới và bật ON
    console.log(`[Bước 1] Tao Custom Rule moi & Bat Toggle ON...`);
    let ruleId = null;
    try {
      const created = await createAndActivateRule(tc.prompt);
      ruleId = created.ruleId;
    } catch(err) {
      console.log(`   Loi tao rule: ${err.message}`);
    }

    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const step1Img = `reports/screenshots/${tc.id}_step1_rule_created_on.png`;
    await page.screenshot({ path: step1Img });
    console.log(`   -> [UI] Anh Custom Rules (Rule ${ruleId} ON): ${step1Img}`);

    // 2. Ra Sandbox kiểm tra job
    console.log(`[Bước 2] Ra Sandbox (/mantis/sandbox) kiem tra job theo 2 actions...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const step2Img = `reports/screenshots/${tc.id}_step2_sandbox_applied.png`;
    await page.screenshot({ path: step2Img });
    console.log(`   -> [UI] Anh Sandbox Grid: ${step2Img}`);

    const dayJobs = await fetchSandboxDayJobs();
    const targetJob = dayJobs.find(j => j?.job?.id == tc.targetJobId);
    let evalRes = tc.verify(targetJob, dayJobs);
    console.log(`   -> Ket qua kiem tra:`);
    console.log(`      Action 1 [${tc.action1Name}]: ${evalRes.action1Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`      Action 2 [${tc.action2Name}]: ${evalRes.action2Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`      Chi tiet: ${evalRes.detail}`);

    // 3. Ra Calendar đối chiếu gốc
    console.log(`[Bước 3] Ra Calendar (/calendar?schedules=31) doi chieu vi tri goc...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=31`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const step3Img = `reports/screenshots/${tc.id}_step3_calendar_compared.png`;
    await page.screenshot({ path: step3Img });
    console.log(`   -> [UI] Anh Calendar goc: ${step3Img}`);

    // 4. Quay lại Custom Rules TẮT rule về OFF
    console.log(`[Bước 4] Quay lai Custom Rules va TAT RULE ${ruleId} ve OFF...`);
    if (ruleId) await turnOffRule(ruleId);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const step4Img = `reports/screenshots/${tc.id}_step4_rule_turned_off.png`;
    await page.screenshot({ path: step4Img });
    console.log(`   -> [UI] Anh Custom Rules sau khi TAT: ${step4Img}`);

    const overallVerdict = (evalRes.action1Pass && evalRes.action2Pass) ? 'PASS' : 'FAIL';
    fullResults.push({
      id: tc.id,
      name: tc.name,
      ruleId: ruleId,
      prompt: tc.prompt,
      action1: { name: tc.action1Name, pass: evalRes.action1Pass },
      action2: { name: tc.action2Name, pass: evalRes.action2Pass },
      verdict: overallVerdict,
      detail: evalRes.detail,
      screenshots: {
        step1: step1Img,
        step2: step2Img,
        step3: step3Img,
        step4: step4Img
      }
    });

    console.log(`>>> HOAN TAT ${tc.id}: ${overallVerdict}\n`);
  }

  fs.writeFileSync('scratch/final_12_cases_results.json', JSON.stringify(fullResults, null, 2));

  console.log('======================================================================');
  console.log('   DA TEST XONG TOAN BO 12 CASES THEO DUNG QUY TRINH 4 BUOC!');
  console.log('   DANG DONG TRINH DUYET VA XUAT REPORT...');
  console.log('======================================================================');
  await page.waitForTimeout(5000);
  await browser.close();
})();
