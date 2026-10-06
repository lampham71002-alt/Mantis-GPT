const { chromium } = require('playwright');
const fs = require('fs');

const TOKEN = '1z8poBmPrckA2J2YMBToxWzIxs2UBmt7XXuaFXWmCQWEwiLicLxeKWiOCzxdG1HgTy25bRQ9j4tBioKhUDTnxYdGN5HmTWWO75iJ1Uqzy42Ed2tZ18HW30s4WU6EK4ux843614451791260718';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GDONWL5A5MI6';

const TEST_CASES = [
  {
    id: 'TC-01',
    name: 'time_window (3:00 PM - 5:00 PM) + last_stop',
    targetService: 'Call Back Service',
    targetJobId: '8499',
    prompt: 'For Call Back Service jobs, schedule between 3:00 PM and 5:00 PM and must be the last stop of the day',
    action1Name: 'time_window (15:00 - 17:00)',
    action2Name: 'last_stop (điểm dừng cuối cùng trong ngày)',
    verify: (targetJob, dayJobs) => {
      const start = targetJob.event?.start || '';
      const inWindow = start.includes('15:') || start.includes('16:') || (targetJob.tile?.header && (targetJob.tile.header.includes('3:') || targetJob.tile.header.includes('4:')));
      const lastJob = dayJobs[dayJobs.length - 1];
      const isLast = (lastJob.job?.id === targetJob.job?.id);
      const pos = dayJobs.findIndex(j => j.job?.id === targetJob.job?.id) + 1;
      return {
        action1Pass: inWindow,
        action2Pass: isLast,
        detail: `Khung giờ: ${targetJob.tile?.header || start} | Vị trí: #${pos}/${dayJobs.length}`
      };
    }
  },
  {
    id: 'TC-02',
    name: 'time_window (8:00 AM - 10:00 AM) + first_stop',
    targetService: 'Eco-Friendly Pest Solutions',
    targetJobId: '8501',
    prompt: 'For Eco-Friendly Pest Solutions jobs, schedule between 8:00 AM and 10:00 AM and must be the first stop of the day',
    action1Name: 'time_window (08:00 - 10:00)',
    action2Name: 'first_stop (điểm dừng đầu tiên trong ngày)',
    verify: (targetJob, dayJobs) => {
      const start = targetJob.event?.start || '';
      const inWindow = start.includes('08:') || start.includes('09:') || (targetJob.tile?.header && (targetJob.tile.header.includes('8:') || targetJob.tile.header.includes('9:')));
      const firstJob = dayJobs[0];
      const isFirst = (firstJob.job?.id === targetJob.job?.id);
      const pos = dayJobs.findIndex(j => j.job?.id === targetJob.job?.id) + 1;
      return {
        action1Pass: inWindow,
        action2Pass: isFirst,
        detail: `Khung giờ: ${targetJob.tile?.header || start} | Vị trí: #${pos}/${dayJobs.length}`
      };
    }
  }
];

async function createAndActivateRule(prompt) {
  console.log(`   [API] Đang gửi prompt: "${prompt}"...`);
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

  if (!logic) throw new Error('Không lấy được executable_logic!');

  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({ executable_logic: logic, conversation_id: convId })
  });

  const cRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({
      title: logic.name || '2 Actions Custom Rule',
      description: logic.rule || prompt,
      attachments: [],
      conversation_id: convId,
      executable_logic: logic
    })
  });
  const cData = await cRes.json();
  const ruleId = cData.data?.id;

  // Bật ON (status: 1)
  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'token': TOKEN },
    body: JSON.stringify({ status: 1 })
  });
  console.log(`   [API] Đã tạo và BẬT ON Rule ID: ${ruleId}`);
  return { ruleId, logic };
}

async function turnOffRule(ruleId) {
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

  // Lọc và lấy trạng thái cuối cùng cho mỗi job trong ngày 2026-10-06
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
  console.log('   MỞ LIVE PREVIEW TRỰC TIẾP Ở PANEL BÊN PHẢI MÀN HÌNH');
  console.log('   THEO DÕI TOÀN BỘ QUY TRÌNH KIỂM THỬ THẬT 100%');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  // Đăng nhập
  console.log('1. Đang đăng nhập hệ thống...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const finalReports = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`\n======================================================================`);
    console.log(`>>> BẮT ĐẦU TEST CASE [${tc.id}]: ${tc.name}`);
    console.log(`    Action 1: ${tc.action1Name}`);
    console.log(`    Action 2: ${tc.action2Name}`);
    console.log(`    Target: Job ID ${tc.targetJobId} (${tc.targetService})`);
    console.log(`======================================================================`);

    // ------------------------------------------------------------------
    // BƯỚC 1: VÀO CUSTOM RULES -> TẠO RULE MỚI -> BẬT TOGGLE ON
    // ------------------------------------------------------------------
    console.log(`\n[Bước 1] Vào Custom Rules và tạo rule mới kết hợp 2 actions...`);
    const { ruleId, logic } = await createAndActivateRule(tc.prompt);

    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const step1Img = `scratch/${tc.id}_step1_rule_created_on.png`;
    await page.screenshot({ path: step1Img });
    console.log(`   -> [UI] Đã chụp ảnh Custom Rules (Rule ${ruleId} đang ON): ${step1Img}`);

    // ------------------------------------------------------------------
    // BƯỚC 2: RA SANDBOX CHECK JOB XEM ĐƯỢC APPLY CHƯA, HIỂN THỊ ĐÚNG THEO RULE KHÔNG
    // ------------------------------------------------------------------
    console.log(`\n[Bước 2] Ra Sandbox (/mantis/sandbox) kiểm tra job hiển thị theo rule...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000); // Đợi tải grid và để user xem trực tiếp trên Live Preview
    const step2Img = `scratch/${tc.id}_step2_sandbox_applied.png`;
    await page.screenshot({ path: step2Img });
    console.log(`   -> [UI] Đã chụp ảnh Sandbox Grid: ${step2Img}`);

    // Đọc dữ liệu Sandbox thực tế qua API
    const dayJobs = await fetchSandboxDayJobs();
    const targetJob = dayJobs.find(j => j.job?.id == tc.targetJobId);

    let evalRes = { action1Pass: false, action2Pass: false, detail: 'Không tìm thấy job' };
    if (targetJob) {
      evalRes = tc.verify(targetJob, dayJobs);
      console.log(`   -> Dữ liệu thực tế Sandbox:`);
      console.log(`      Job: ${targetJob.job?.name} (ID: ${targetJob.job?.id})`);
      console.log(`      ${evalRes.detail}`);
    }

    console.log(`   -> Đánh giá kiểm thử:`);
    console.log(`      Action 1 [${tc.action1Name}]: ${evalRes.action1Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`      Action 2 [${tc.action2Name}]: ${evalRes.action2Pass ? '✅ PASS' : '❌ FAIL'}`);

    // ------------------------------------------------------------------
    // BƯỚC 3: RA CALENDAR XEM JOB ĐÓ ĐỂ ĐỐI CHIẾU VỚI GỐC
    // ------------------------------------------------------------------
    console.log(`\n[Bước 3] Ra Main Calendar (/calendar) kiểm tra job gốc để đối chiếu...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=31`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000); // Để user xem trực tiếp trên Live Preview
    const step3Img = `scratch/${tc.id}_step3_calendar_compared.png`;
    await page.screenshot({ path: step3Img });
    console.log(`   -> [UI] Đã chụp ảnh Calendar gốc: ${step3Img}`);

    // ------------------------------------------------------------------
    // BƯỚC 4: QUAY LẠI TẮT RULE VỪA TẠO VỀ OFF
    // ------------------------------------------------------------------
    console.log(`\n[Bước 4] Quay lại Custom Rules và TẮT RULE ${ruleId} về OFF trước khi tạo rule tiếp theo...`);
    await turnOffRule(ruleId);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const step4Img = `scratch/${tc.id}_step4_rule_turned_off.png`;
    await page.screenshot({ path: step4Img });
    console.log(`   -> [UI] Đã chụp ảnh Custom Rules sau khi TẮT rule: ${step4Img}`);

    const overallVerdict = (evalRes.action1Pass && evalRes.action2Pass) ? 'PASS' : 'FAIL';
    finalReports.push({
      id: tc.id,
      name: tc.name,
      ruleId: ruleId,
      prompt: tc.prompt,
      targetJobId: tc.targetJobId,
      targetService: tc.targetService,
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

    console.log(`\n>>> KẾT QUẢ TEST CASE [${tc.id}]: ${overallVerdict}`);
  }

  fs.writeFileSync('scratch/live_2actions_verified_report.json', JSON.stringify(finalReports, null, 2));

  console.log('\n======================================================================');
  console.log('   TẤT CẢ TEST CASES ĐÃ HOÀN TẤT ĐÚNG QUY TRÌNH 4 BƯỚC!');
  console.log('   ĐANG GIỮ TRÌNH DUYỆT 25 GIÂY ĐỂ USER QUAN SÁT HOÀN TẤT');
  console.log('======================================================================');
  await page.waitForTimeout(25000);
  await browser.close();
})();
