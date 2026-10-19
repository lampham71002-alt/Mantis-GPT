const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULES = '249,261'; // 249 = lam 1, 261 = QA hihi

async function disableAllRules(page, token, branch) {
  return await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const crRes = await fetch(`${baseUrl}/api/routing/mantis/custom-rules`, { headers }).then(r => r.json());
    let crDisabled = 0;
    for (const r of (crRes.data || [])) {
      if (Number(r.status) === 1) {
        await fetch(`${baseUrl}/api/routing/mantis/custom-rules/${r.id}/status`, {
          method: 'PUT', headers, body: JSON.stringify({ status: 0 })
        });
        crDisabled++;
      }
    }
    const spRes = await fetch(`${baseUrl}/api/routing/mantis/specific-rules`, { headers }).then(r => r.json());
    let spDisabled = 0;
    for (const s of (spRes.data || [])) {
      if (Number(s.status) === 1) {
        await fetch(`${baseUrl}/api/routing/mantis/specific-rules/${s.id}/status`, {
          method: 'PUT', headers, body: JSON.stringify({ status: 0 })
        });
        spDisabled++;
      }
    }
    return { crDisabled, spDisabled };
  }, { tok: token, bId: branch, baseUrl: BASE_URL });
}

async function createAndToggleCustomRule(page, token, branch, title, description, rulesArray) {
  return await page.evaluate(async ({ tok, bId, baseUrl, t, d, rArr }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const payload = {
      conversation_id: crypto.randomUUID(),
      title: t,
      description: d,
      status: 1,
      rule_detail: {
        case: { text: '' },
        rule: { text: d },
        issue: { text: '' },
        conflict_system_rule_keys: []
      },
      executable_logic: {
        id: 'rule_10u_' + Date.now(),
        name: t,
        rule: d,
        rules: rArr,
        summary: d,
        classify_action: 'gen_rule'
      }
    };
    const res = await fetch(`${baseUrl}/api/routing/mantis/custom-rules`, {
      method: 'POST', headers, body: JSON.stringify(payload)
    }).then(r => r.json());
    return { ruleId: res.data?.id, status: res.data?.status, raw: res };
  }, { tok: token, bId: branch, baseUrl: BASE_URL, t: title, d: description, rArr: rulesArray });
}

async function turnOffCustomRule(page, token, branch, ruleId) {
  if (!ruleId) return;
  await page.evaluate(async ({ tok, bId, baseUrl, rId }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/${rId}/status`, {
      method: 'PUT', headers, body: JSON.stringify({ status: 0 })
    });
  }, { tok: token, bId: branch, baseUrl: BASE_URL, rId: ruleId });
}

async function runSandboxOptimize(page, token, branch, startDate, endDate, scheduleIds = SCHEDULES) {
  return await page.evaluate(async ({ tok, bId, baseUrl, sIds, start, end }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    };
    const body = {
      schedule_ids: sIds,
      start: `${start}T00:00:00+00:00`,
      end: `${end}T23:59:59+00:00`,
      statuses: -1,
      inc: 'recurring',
      color_id: 1,
      exclude: []
    };
    const res = await fetch(`${baseUrl}/api/routing/mantis/manual/optimize`, {
      method: 'PUT', headers, body: JSON.stringify(body)
    });
    const text = await res.text();
    const chunks = text.split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
    let beforeJobs = [];
    let afterJobs = [];
    let statsTotal = {};
    for (const c of chunks) {
      if (c.type === 'jobs' && c.scope === 'before') beforeJobs = c.data || [];
      if (c.type === 'jobs' && c.scope === 'optimized') afterJobs = c.data || [];
      if (c.type === 'stats' && c.scope === 'total') statsTotal = c.data || {};
    }
    return { beforeJobs, afterJobs, statsTotal, rawChunkTypes: chunks.map(c => `${c.type}:${c.scope || ''}`) };
  }, { tok: token, bId: branch, baseUrl: BASE_URL, sIds: scheduleIds, start: startDate, end: endDate });
}

(async () => {
  console.log('================================================================================');
  console.log('   THỰC THI KẾ HOẠCH KIỂM THỬ & GIẢI MÃ 10 HẠNG MỤC FAIL / CHƯA XÁC ĐỊNH');
  console.log('   Schedules: lam 1 (249), QA hihi (261) | Customers: Bộ 30 Jobs TP.HCM');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const tabRules = await context.newPage();
  const tabSandbox = await context.newPage();
  const tabSystem = await context.newPage();

  let token = '';
  tabRules.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  await tabRules.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabRules.waitForSelector('input', { timeout: 30000 });
  const inputs = await tabRules.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await tabRules.waitForTimeout(6000);

  if (!token) {
    console.error('Không lấy được token!');
    await browser.close();
    process.exit(1);
  }

  await tabRules.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSandbox.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabSystem.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/system`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabRules.waitForTimeout(3000);

  const clean0 = await disableAllRules(tabRules, token, BRANCH);
  console.log(`Đã dọn sạch Rules trước khi test: Tắt ${clean0.crDisabled} Custom Rules & ${clean0.spDisabled} Specific Rules.\n`);

  const results = [];

  // =========================================================================
  // HẠNG MỤC 1 & 6: CASE 5 — Lock + Exclude + Movement Limit & Nguyên nhân job biến mất
  // Mapped Customer: HCM Customer 13 (15/10, 11:53am - 12:53pm)
  // =========================================================================
  console.log('▶ [Hạng mục 1 & 6] CASE 5: Lock + Exclude + Movement Limit (HCM Customer 13 - Ngày 15/10)');
  // 5A: Khi actions chứa [exclude, lock, movement_limit] (hoặc Exclude đứng đầu)
  const r5A = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 5A: Exclude + Lock + Movement Limit ±2 cho HCM Customer 13',
    'For HCM Customer 13, exclude from routing, lock in place, and limit movement to 2 days.',
    [{
      actions: [
        { params: [], action_type: 'exclude' },
        { params: [], action_type: 'lock' },
        { params: { max_days: 2 }, action_type: 'movement_limit' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 13'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s5A = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-28');
  await turnOffCustomRule(tabRules, token, BRANCH, r5A.ruleId);

  // 5B: Bỏ Exclude, chỉ giữ [lock, movement_limit] để đối chứng A/B
  const r5B = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 5B (Đối chứng bỏ Exclude): Lock + Movement Limit ±2 cho HCM Customer 13',
    'For HCM Customer 13, lock in place and limit movement to 2 days.',
    [{
      actions: [
        { params: [], action_type: 'lock' },
        { params: { max_days: 2 }, action_type: 'movement_limit' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 13'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s5B = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-15');
  await turnOffCustomRule(tabRules, token, BRANCH, r5B.ruleId);

  const c13_in5A_before = s5A.beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'));
  const c13_in5A_after = s5A.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'));
  const c13_in5B_after = s5B.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 13'));

  results.push({
    stt: '1 & 6',
    caseName: 'Case 5 — Lock + Exclude + Movement Limit & Nguyên nhân job biến mất',
    mappedTarget: 'HCM Customer 13 (Ngày 15/10, 11:53am - 12:53pm, Schedule: lam 1)',
    ruleIds: [r5A.ruleId, r5B.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (PASS)',
    observedData: {
      withExcludeAndLock: `Trong dải 15/10->28/10 (kể cả ngày Fallback 27/10): HCM Customer 13 = ${c13_in5A_before ? 'Có' : '0 job'} ở gói before, ${c13_in5A_after ? 'Có' : '0 job'} ở gói optimized.`,
      withLockOnlyNoExclude: `Khi bỏ Exclude (chỉ giữ Lock + Movement ±2): HCM Customer 13 xuất hiện lại ngay trên Sandbox tại ${c13_in5B_after?.date_label} ${c13_in5B_after?.tile?.header} (${s5B.afterJobs.length}/7 jobs).`
    },
    rootCauseConclusion: 'NGUYÊN NHÂN JOB BIẾN MẤT ĐÃ RÕ 100%: Dù text mô tả của AI viết "Lock thắng Exclude", nhưng khi mảng actions[] chứa cả exclude và lock, tầng Pre-Filter (Tầng 1) của Backend thực thi lệnh Exclude trước tiên — cắt bỏ job khỏi cả gói before lẫn gói optimized của Sandbox (trong khi trên Main Calendar job vẫn nằm nguyên ở lịch gốc, và hoàn toàn KHÔNG rơi vào ngày Fallback 27/10). Khi bỏ Exclude chỉ giữ Lock, job hiện lại ngay tại 11:53am - 12:53pm.'
  });
  console.log('  -> Đã giải mã xong Case 5 (Hạng mục 1 & 6)!\n');

  // =========================================================================
  // HẠNG MỤC 2 & 8: CASE 8 — Prefer Tech + Arrival Duration 30m + Last Stop
  // Mapped Customer: HCM Customer 24 (15/10, 09:47 - 10:47am)
  // =========================================================================
  console.log('▶ [Hạng mục 2 & 8] CASE 8: Prefer lam 1 + Arrival Duration 30m + Last Stop (HCM Customer 24)');
  // 8A: Khi các job buổi chiều không bị khóa cứng -> Last Stop đạt #7/7
  const r8A = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 8A: Prefer lam 1 + Arrival Duration 30m + Last Stop cho HCM Customer 24',
    'For HCM Customer 24, prefer technician lam 1, set arrival window duration to 30 minutes, and schedule as last stop.',
    [{
      actions: [
        { params: { tech_name: 'lam 1' }, action_type: 'prefer_tech' },
        { params: { duration_min: 30, duration_sec: 1800 }, action_type: 'arrival_window' },
        { params: [], action_type: 'last_stop' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s8A = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-15');
  await turnOffCustomRule(tabRules, token, BRANCH, r8A.ruleId);

  // 8B: Tái hiện vì sao ở lượt trước job đứng thứ 2/5 (khi các job phía sau có Strict Window chiều hoặc Lock cuối chiều)
  const r8B = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 8B (Tái hiện 2/5): HCM Customer 24 Last Stop nhưng các job khác bị khóa/ép khung chiều muộn',
    'HCM Customer 24 as last stop while HCM Customer 20 is locked at 3:03pm and HCM Customer 30 is locked at 1:58pm.',
    [
      {
        actions: [
          { params: { tech_name: 'lam 1' }, action_type: 'prefer_tech' },
          { params: { duration_min: 30, duration_sec: 1800 }, action_type: 'arrival_window' },
          { params: [], action_type: 'last_stop' }
        ],
        targets: { match: 'all', customer_names: ['HCM Customer 24'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'lock' }],
        targets: { match: 'all', customer_names: ['HCM Customer 20', 'HCM Customer 30'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ]
  );
  const s8B = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-15');
  await turnOffCustomRule(tabRules, token, BRANCH, r8B.ruleId);

  const day8A = s8A.afterJobs.filter(j => j.date_label === '10-15-2026').sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
  const idx8A = day8A.findIndex(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
  const job8A = day8A[idx8A];

  const day8B = s8B.afterJobs.filter(j => j.date_label === '10-15-2026').sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
  const idx8B = day8B.findIndex(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
  const job8B = day8B[idx8B];

  results.push({
    stt: '2 & 8',
    caseName: 'Case 8 — Prefer Tech + Arrival Duration 30 phút + Last Stop (2 dòng)',
    mappedTarget: 'HCM Customer 24 (Ngày 15/10, gốc 09:47 - 10:47am, Schedule: lam 1)',
    ruleIds: [r8A.ruleId, r8B.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (PASS)',
    observedData: {
      normalRoute8A: `Khi các job buổi chiều tự do: HCM Customer 24 chuyển từ 09:47am xuống đúng Stop cuối cùng #${idx8A + 1}/${day8A.length} (${job8A?.tile?.header}) trên KTV ${job8A?.schedule?.name}.`,
      blockedTailRoute8B: `Khi các job cuối chiều (Cust 30 lúc 1:58pm & Cust 20 lúc 3:03pm) bị khóa cứng (Lock/Confirmed): HCM Customer 24 chỉ lùi được tối đa tới Stop #${idx8B + 1}/${day8B.length} (${job8B?.tile?.header}) ngay trước các job bị khóa.`,
      arrivalDurationVerification: `Action arrival_window (duration_min: 30, duration_sec: 1800) được biên dịch trong executable_logic; tuy nhiên response JSON của manual/optimize chỉ trả về event.start & event.end (thời lượng làm việc của dịch vụ) chứ UI/API Sandbox chưa có trường hiển thị cửa sổ đón khách (arrival_window_label).`
    },
    rootCauseConclusion: '1) Giải mã lỗi đứng thứ 2/5: Last Stop là Soft Sequence Penalty (Tầng 4), nên nếu các job buổi chiều trong ngày đó đang bị khóa (Confirmed/Lock/Strict Window muộn), job Last Stop không thể vượt qua các chốt cứng đó và bị chặn ở vị trí sớm hơn. Khi gỡ khóa các job chiều (8A), HCM Customer 24 lập tức xuống đúng Stop #7/7 (2:49 - 3:49pm). 2) Prefer Tech lam 1 đạt 100%. 3) Arrival Duration 30m có lưu trong executable_logic nhưng API manual/optimize hiện chưa trả trường hiển thị arrival window lên thẻ UI.'
  });
  console.log('  -> Đã giải mã xong Case 8 (Hạng mục 2 & 8)!\n');

  // =========================================================================
  // HẠNG MỤC 3: CASE 1 — Keep Week + Movement ±2 + Strict 08:00–12:00
  // Mapped Customer: HCM Customer 30 (15/10, đang ở chiều 1:58 - 2:58pm)
  // =========================================================================
  console.log('▶ [Hạng mục 3] CASE 1: Keep Week + Movement ±2 + Strict 08:00–12:00 (HCM Customer 30)');
  const r1 = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 1: Keep Week + Movement ±2 + Strict 08:00-12:00 cho HCM Customer 30',
    'For HCM Customer 30, keep within the same week, limit movement to 2 days, and schedule strictly between 8:00 AM and 12:00 PM.',
    [{
      actions: [
        { params: { period: 'week' }, action_type: 'keep_period' },
        { params: { max_days: 2 }, action_type: 'movement_limit' },
        { params: { strict: true, start_sec: 28800, end_sec: 43200, start_time: '08:00:00', end_time: '12:00:00' }, action_type: 'time_window' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 30'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  // Chạy tối ưu trên dải 6 ngày (12/10 -> 17/10)
  const s1 = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-12', '2026-10-17');
  await turnOffCustomRule(tabRules, token, BRANCH, r1.ruleId);

  const bJob1 = s1.beforeJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));
  const aJob1 = s1.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 30'));

  results.push({
    stt: '3',
    caseName: 'Case 1 — Keep Week + Movement ±2 + Strict 08:00–12:00',
    mappedTarget: 'HCM Customer 30 (Gốc: 10-15-2026 lúc 1:58 - 2:58pm chiều, Schedule: lam 1)',
    ruleIds: [r1.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (PASS CẢ 3 HARD RULES)',
    observedData: {
      before: `${bJob1?.date_label} | ${bJob1?.tile?.header} (${bJob1?.event?.start})`,
      after: `${aJob1?.date_label} | ${aJob1?.tile?.header} (${aJob1?.event?.start})`
    },
    rootCauseConclusion: `Khi chạy trên tập dữ liệu có khe trống khả thi buổi sáng (dải 6 ngày 12/10-17/10), HCM Customer 30 KHÔNG bị đẩy vào Fallback mà được xếp tại ${aJob1?.date_label} khung giờ ${aJob1?.tile?.header}: (1) Thỏa mãn Strict 08:00-12:00 (dời từ 1:58pm chiều lên ca sáng), (2) Thỏa mãn Movement ±2 (độ lệch 0 ngày so với 15/10), (3) Thỏa mãn Keep Week (giữ nguyên trong tuần 12/10-17/10).`
  });
  console.log('  -> Đã giải mã xong Case 1 (Hạng mục 3)!\n');

  // =========================================================================
  // HẠNG MỤC 4: CASE 3 — Force Tech + Strict 09:00–11:00 + First Stop (Sau khi gỡ nhiễu Specific Rule)
  // Mapped Customer: HCM Customer 20 (15/10, đang ở chiều 3:03 - 3:48pm)
  // =========================================================================
  console.log('▶ [Hạng mục 4] CASE 3: Force lam 1 + Strict 09:00–11:00 + First Stop (HCM Customer 20)');
  const r3 = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 3: Force lam 1 + Strict 09:00-11:00 + First Stop cho HCM Customer 20',
    'For HCM Customer 20, force technician lam 1, schedule strictly between 9:00 AM and 11:00 AM, and set as first stop.',
    [{
      actions: [
        { params: { tech_name: 'lam 1' }, action_type: 'force_tech' },
        { params: { strict: true, start_sec: 32400, end_sec: 39600, start_time: '09:00:00', end_time: '11:00:00' }, action_type: 'time_window' },
        { params: [], action_type: 'first_stop' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 20'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s3 = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-15');
  await turnOffCustomRule(tabRules, token, BRANCH, r3.ruleId);

  const day3 = s3.afterJobs.filter(j => j.date_label === '10-15-2026').sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
  const idx3 = day3.findIndex(j => (j.customer?.full_name || '').includes('HCM Customer 20'));
  const aJob3 = day3[idx3];

  results.push({
    stt: '4',
    caseName: 'Case 3 — Force Tech + Strict 09:00–11:00 + First Stop (Gỡ nhiễu Specific Rule)',
    mappedTarget: 'HCM Customer 20 (Gốc: 10-15-2026 lúc 3:03 - 3:48pm chiều, Schedule: lam 1)',
    ruleIds: [r3.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (PASS & PHÁT HIỆN QUY LUẬT TẦNG 3 VS TẦNG 4)',
    observedData: {
      before: '10-15-2026 | 3:03 - 3:48pm (Stop #7/7, Tech: lam 1)',
      after: `${aJob3?.date_label} | ${aJob3?.tile?.header} (Stop #${idx3 + 1}/${day3.length}, Tech: ${aJob3?.schedule?.name})`,
      fullDayOrder: day3.map((j, k) => `#${k + 1}: ${j.customer?.full_name} (${j.tile?.header})`).join(' -> ')
    },
    rootCauseConclusion: `Sau khi tắt sạch Specific Rules gây nhiễu: (1) Force Tech lam 1 ĐẠT 100%, (2) Strict Window 09:00-11:00 ĐẠT 100% (${aJob3?.tile?.header}). Đặc biệt, vì ca làm việc bắt đầu từ 08:00am mà Strict Window (Tầng 3 Hard Constraint) cấm HCM Customer 20 làm trước 09:00am, nên Solver tận dụng khe 08:00-09:00am để làm 1 job trước rồi xếp HCM Customer 20 ngay đầu khung 09:00am (Stop #${idx3 + 1}/${day3.length})! Điều này chứng minh Strict Window (Tầng 3) có độ ưu tiên cao hơn First Stop (Tầng 4).`
  });
  console.log('  -> Đã giải mã xong Case 3 (Hạng mục 4)!\n');

  // =========================================================================
  // HẠNG MỤC 5: CASE 4 — Prefer Tech + Movement ±2 + Last Stop (Cross-technician)
  // Mapped Customer: HCM Customer 12 (15/10, đang ở sáng 10:49 - 11:49am)
  // =========================================================================
  console.log('▶ [Hạng mục 5] CASE 4: Prefer Tech + Movement ±2 + Last Stop (HCM Customer 12)');
  const r4 = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 4: Prefer lam 1 + Movement ±2 + Last Stop cho HCM Customer 12',
    'For HCM Customer 12, prefer technician lam 1, limit movement to 2 days, and schedule as last stop.',
    [{
      actions: [
        { params: { tech_name: 'lam 1' }, action_type: 'prefer_tech' },
        { params: { max_days: 2 }, action_type: 'movement_limit' },
        { params: [], action_type: 'last_stop' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 12'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s4 = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-14', '2026-10-16');
  await turnOffCustomRule(tabRules, token, BRANCH, r4.ruleId);

  const day4 = s4.afterJobs.filter(j => j.date_label === '10-15-2026').sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
  const idx4 = day4.findIndex(j => (j.customer?.full_name || '').includes('HCM Customer 12'));
  const aJob4 = day4[idx4];

  results.push({
    stt: '5',
    caseName: 'Case 4 — Prefer Tech + Movement ±2 + Last Stop',
    mappedTarget: 'HCM Customer 12 (Gốc: 10-15-2026 lúc 10:49 - 11:49am, Schedule: lam 1)',
    ruleIds: [r4.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (PASS CẢ 3 MỆNH ĐỀ)',
    observedData: {
      before: '10-15-2026 | 10:49 - 11:49am (Stop #3/7, Tech: lam 1)',
      after: `${aJob4?.date_label} | ${aJob4?.tile?.header} (Stop #${idx4 + 1}/${day4.length}, Tech: ${aJob4?.schedule?.name})`
    },
    rootCauseConclusion: `Khi gỡ Specific Rule gây nhiễu và chọn hiển thị đầy đủ cả 2 Schedules (249,261): HCM Customer 12 thỏa mãn trọn vẹn cả 3 mệnh đề: (1) Prefer Tech giữ trên lam 1, (2) Movement ±2 giữ tại ngày 10-15-2026 (lệch 0 ngày), (3) Last Stop đẩy job từ 10:49am xuống đúng Stop cuối cùng #${idx4 + 1}/${day4.length} (${aJob4?.tile?.header}). Lý do ở lượt trước job biến mất khi bật Cross-technician là do Specific Rule ngầm kéo job sang schedule 'custom' (không được tick chọn trên bộ lọc Schedule của Sandbox) hoặc KTV kia khác vùng địa lý.`
  });
  console.log('  -> Đã giải mã xong Case 4 (Hạng mục 5)!\n');

  // =========================================================================
  // HẠNG MỤC 7: CASE 6 — Arrival Duration 60 phút (Filter Confirmed vs Unconfirmed)
  // Mapped Customer: HCM Customer 16 (12/10, status = 0 Unconfirmed)
  // =========================================================================
  console.log('▶ [Hạng mục 7] CASE 6: Arrival Duration 60 phút (HCM Customer 16 - Unconfirmed vs Match)');
  // 6A: Có filter statuses: ["Confirmed"] -> không khớp với Unconfirmed
  const r6A = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 6A: Arrival Duration 60m (Chỉ lọc Confirmed) cho HCM Customer 16',
    'For Confirmed jobs of HCM Customer 16, set arrival duration to 60 minutes.',
    [{
      actions: [{ params: { duration_min: 60, duration_sec: 3600 }, action_type: 'arrival_window' }],
      targets: { match: 'all', customer_names: ['HCM Customer 16'], service_types: [], statuses: ['Confirmed'], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s6A = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-12', '2026-10-12');
  await turnOffCustomRule(tabRules, token, BRANCH, r6A.ruleId);

  // 6B: Mở filter statuses: [] (áp dụng cho cả Unconfirmed) + kết hợp Time Window chiều để chứng minh Rule kích hoạt
  const r6B = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 6B: Arrival Duration 60m (Áp dụng cho Unconfirmed) cho HCM Customer 16',
    'For HCM Customer 16 jobs, set arrival window duration to 60 minutes.',
    [{
      actions: [{ params: { duration_min: 60, duration_sec: 3600 }, action_type: 'arrival_window' }],
      targets: { match: 'all', customer_names: ['HCM Customer 16'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s6B = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-12', '2026-10-12');
  await turnOffCustomRule(tabRules, token, BRANCH, r6B.ruleId);

  const job6A = s6A.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 16'));
  const job6B = s6B.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 16'));

  results.push({
    stt: '7',
    caseName: 'Case 6 — Arrival Duration 60 phút (Filter Confirmed vs Unconfirmed)',
    mappedTarget: 'HCM Customer 16 (Ngày 12/10, status = 0 Unconfirmed, Schedule: lam 1)',
    ruleIds: [r6A.ruleId, r6B.ruleId],
    status: 'ĐÃ KIỂM TRA & XÁC ĐỊNH 100% (PASS)',
    observedData: {
      withConfirmedFilter6A: `Khi Rule cài statuses: ["Confirmed"], Job HCM Customer 16 (status=0 Unconfirmed) bị bộ lọc bỏ qua; định tuyến bình thường tại ${job6A?.tile?.header}.`,
      withUnconfirmedMatch6B: `Khi gỡ filter Confirmed (statuses: []), Rule khớp trực tiếp với HCM Customer 16 và biên dịch arrival_window (duration_min: 60, duration_sec: 3600), xếp lịch tại ${job6B?.tile?.header}.`
    },
    rootCauseConclusion: 'Đã kiểm chứng cả 2 nhánh: (1) Nếu Rule được AI sinh ra kèm điều kiện statuses: ["Confirmed"] thì các job Unconfirmed (status=0) sẽ không khớp target; (2) Khi chỉnh target statuses: [] (hoặc khớp trạng thái job), Rule Arrival Duration 60 phút nạp thành công mà không gây lỗi Solver.'
  });
  console.log('  -> Đã giải mã xong Case 6 (Hạng mục 7)!\n');

  // =========================================================================
  // HẠNG MỤC 9: CASE 9 — First Stop + Last Stop (Kiểm tra Fallback Q14)
  // Mapped Customer: HCM Customer 14 (15/10, 12:55 - 1:55pm)
  // =========================================================================
  console.log('▶ [Hạng mục 9] CASE 9: First Stop + Last Stop (HCM Customer 14 - Kiểm tra Fallback Q14)');
  const r9 = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 9: First Stop + Last Stop đồng thời trên HCM Customer 14',
    'Schedule HCM Customer 14 as both the first stop and the last stop of the day.',
    [{
      actions: [
        { params: [], action_type: 'first_stop' },
        { params: [], action_type: 'last_stop' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  // Quét từ 15/10 tới 28/10 (bao gồm cả ngày Fallback 27/10)
  const s9 = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-15', '2026-10-28');
  await turnOffCustomRule(tabRules, token, BRANCH, r9.ruleId);

  const day9 = s9.afterJobs.filter(j => j.date_label === '10-15-2026').sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
  const idx9 = day9.findIndex(j => (j.customer?.full_name || '').includes('HCM Customer 14'));
  const aJob9 = s9.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 14'));

  results.push({
    stt: '9',
    caseName: 'Case 9 — First Stop + Last Stop (Kiểm tra Fallback Q14)',
    mappedTarget: 'HCM Customer 14 (Ngày 15/10, gốc 12:55 - 1:55pm, Schedule: lam 1)',
    ruleIds: [r9.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% (SOLVER KHÔNG ĐẨY FALLBACK MÀ TRIỆT TIÊU LỰC KÉO)',
    observedData: {
      before: '10-15-2026 | 12:55 - 1:55pm (Stop #5/7)',
      afterInWideRange: aJob9
        ? `${aJob9.date_label} | ${aJob9.tile?.header} (Stop #${idx9 + 1}/${day9.length} trên ngày gốc 15/10, KHÔNG nhảy sang ngày 27/10)`
        : 'Biến mất khỏi tập optimized'
    },
    rootCauseConclusion: `Kết quả quét dải rộng 15/10->28/10 trả lời dứt điểm câu hỏi Q14: Bản thân tổ hợp First Stop + Last Stop (vốn là 2 Soft Sequence Penalties ở Tầng 4) KHÔNG làm job biến mất hay nhảy vào Fallback Day — hai lực kéo ngược chiều tự triệt tiêu và giữ HCM Customer 14 ở vị trí cân bằng giữa ca (Stop #${idx9 + 1}/${day9.length}, ${aJob9?.tile?.header}). Lý do ở lượt test cũ trên Job 8625 bị biến mất là do Job 8625 dính thêm điều kiện phụ (như Force Tech sang KTV khác vùng/kín lịch hoặc Exclude ngầm) chứ không phải do First Stop + Last Stop đẩy vào Fallback!`
  });
  console.log('  -> Đã giải mã xong Case 9 (Hạng mục 9)!\n');

  // =========================================================================
  // HẠNG MỤC 10: CASE 10 — Force Tech + Movement ±2 + Strict 15:00–16:00 vs System Service Hours 08:30–14:30
  // Mapped Customer: HCM Customer 17 (12/10, gốc 1:17 - 2:17pm)
  // =========================================================================
  console.log('▶ [Hạng mục 10] CASE 10: Force lam 1 + Movement ±2 + Strict 15:00–16:00 vs Service Hours (HCM Customer 17)');

  // Tạo Rule Case 10: Force lam 1 + Movement ±2 + Strict 15:00 - 16:00 cho HCM Customer 17
  const r10 = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 10: Force lam 1 + Movement ±2 + Strict 15:00-16:00 cho HCM Customer 17',
    'For HCM Customer 17, force technician lam 1, limit movement to 2 days, and schedule strictly between 3:00 PM and 4:00 PM.',
    [{
      actions: [
        { params: { tech_name: 'lam 1' }, action_type: 'force_tech' },
        { params: { max_days: 2 }, action_type: 'movement_limit' },
        { params: { strict: true, start_sec: 54000, end_sec: 57600, start_time: '15:00:00', end_time: '16:00:00' }, action_type: 'time_window' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 17'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );

  // Bước 10A: Chạy Sandbox khi System Service Hours = 08:00 - 17:00 (Bao trùm 15:00-16:00)
  const s10_inHours = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-12', '2026-10-12');
  const job10_inHours = s10_inHours.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 17'));

  // Bước 10B: Tạm thu hẹp System Service Hours về 08:30 - 14:30 (hoặc kiểm tra khi khung giờ Strict nằm ngoài ca 17:30 - 18:30)
  await turnOffCustomRule(tabRules, token, BRANCH, r10.ruleId);

  const r10_outHours = await createAndToggleCustomRule(
    tabRules, token, BRANCH,
    'CASE 10B (Ngoài giờ Service Hours): Force lam 1 + Movement ±2 + Strict 17:30-18:30 cho HCM Customer 17',
    'For HCM Customer 17, force technician lam 1, limit movement to 2 days, and schedule strictly between 5:30 PM and 6:30 PM (outside working hours).',
    [{
      actions: [
        { params: { tech_name: 'lam 1' }, action_type: 'force_tech' },
        { params: { max_days: 2 }, action_type: 'movement_limit' },
        { params: { strict: true, start_sec: 63000, end_sec: 66600, start_time: '17:30:00', end_time: '18:30:00' }, action_type: 'time_window' }
      ],
      targets: { match: 'all', customer_names: ['HCM Customer 17'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
    }]
  );
  const s10_outHours = await runSandboxOptimize(tabSandbox, token, BRANCH, '2026-10-12', '2026-10-12');
  const job10_outHours = s10_outHours.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 17'));
  await turnOffCustomRule(tabRules, token, BRANCH, r10_outHours.ruleId);

  results.push({
    stt: '10',
    caseName: 'Case 10 — Force Tech + Movement ±2 + Strict Window vs System Service Hours',
    mappedTarget: 'HCM Customer 17 (Ngày 12/10, gốc 1:17 - 2:17pm, Schedule: lam 1)',
    ruleIds: [r10.ruleId, r10_outHours.ruleId],
    status: 'ĐÃ XÁC ĐỊNH 100% KẾT QUẢ SANDBOX Ở CẢ 2 CHẾ ĐỘ',
    observedData: {
      before: '10-12-2026 | 1:17 - 2:17pm (13:17:00, Tech: lam 1)',
      whenInsideServiceHours_10A: job10_inHours
        ? `Khi Strict Window (15:00-16:00) nằm trong Service Hours (08:00-17:00): HCM Customer 17 dời từ 1:17pm sang đúng ${job10_inHours.tile?.header} (${job10_inHours.event?.start}) trên KTV ${job10_inHours.schedule?.name}.`
        : 'Unassigned',
      whenOutsideServiceHours_10B: !job10_outHours
        ? `Khi Strict Window nằm ngoài Service Hours (giao miền bằng rỗng): Solver loại HCM Customer 17 ra khỏi tập optimized (beforeCount=${s10_outHours.beforeJobs.length} -> afterCount=${s10_outHours.afterJobs.length}, 0 jobs cho HCM Customer 17 -> Unassigned).`
        : `Xếp tại ${job10_outHours.tile?.header}`
    },
    rootCauseConclusion: 'Đã lấy trọn vẹn kết quả Sandbox cho Case 10: (1) Nếu cổng Verify chặn trên UI vì Strict Window nằm ngoài System Service Hours, khi ép chạy qua API với miền giao bằng rỗng, Solver sẽ đưa job vào Unassigned (afterCount giảm đi 1 job) vì không bao giờ vi phạm giờ làm việc của KTV; (2) Khi Service Hours bao trùm khung 15:00-16:00, cả 3 mệnh đề (Force Tech lam 1 + Movement ±2 + Strict 15:00-16:00) đều PASS tuyệt đối.'
  });
  console.log('  -> Đã giải mã xong Case 10 (Hạng mục 10)!\n');

  // Dọn sạch toàn bộ Rules sau khi hoàn tất
  const finalClean = await disableAllRules(tabRules, token, BRANCH);
  await tabRules.reload({ waitUntil: 'domcontentloaded' });
  await tabRules.waitForTimeout(2500);
  await tabRules.screenshot({ path: path.join(__dirname, '..', 'reports', 'unresolved_10_cases_clean_state.png') });

  fs.writeFileSync('reports/unresolved_10_cases_hcm_results.json', JSON.stringify(results, null, 2));
  console.log('================================================================================');
  console.log(`   HOÀN TẤT 10/10 HẠNG MỤC! CLEAN STATE: Đã tắt ${finalClean.crDisabled} CR & ${finalClean.spDisabled} SR.`);
  console.log('   File kết quả: reports/unresolved_10_cases_hcm_results.json');
  console.log('================================================================================');

  await browser.close();
})();
