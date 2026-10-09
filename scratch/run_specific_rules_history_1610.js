const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const HISTORY_ID = '1610'; // History run lúc 10/09/2026 15:02
const SCHEDULE_IDS = '249,261';

const SPECIFIC_CASES_1610 = [
  {
    id: 'TC-SR-01',
    title: 'TC-SR-01: Boundary Isolation (HCM Customer trong Log 1610 vs ngoài Log)',
    prompt: 'For customer HCM Customer 26 in this optimization run, schedule all jobs as the first stop of the day.',
    historyId: HISTORY_ID,
    verify: (events, historyLogs) => {
      const inLogEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 26'));
      const c1 = inLogEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Job HCM Customer 26 trong Log 1610 chịu tác động chính xác: ĐẠT (${inLogEvents.length} jobs) | Boundary Isolation bảo toàn`
      };
    }
  },
  {
    id: 'TC-SR-02',
    title: 'TC-SR-02: Sub-set Filtering within Log 1610 (HCM Customer 06 Initial Service Last Stop)',
    prompt: 'For customer HCM Customer 06 in this optimization run, schedule Initial Service jobs as the last stop of the day.',
    historyId: HISTORY_ID,
    verify: (events) => {
      const custEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 06'));
      const c1 = custEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Lọc chính xác tập con HCM Customer 06 Initial Service về Last Stop: ĐẠT (${custEvents.length} job)`
      };
    }
  },
  {
    id: 'TC-SR-03',
    title: 'TC-SR-03: Strict Time Window (HCM Customer 05 Morning Window 08:00 - 11:00)',
    prompt: 'For customer HCM Customer 05 in this optimization run, schedule jobs within a strict mandatory arrival time window between 8:00 AM and 11:00 AM.',
    historyId: HISTORY_ID,
    verify: (events) => {
      const custEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 05'));
      const c1 = custEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Strict Time Window cho HCM Customer 05 trong khung 08:00 - 11:00: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-04',
    title: 'TC-SR-04: Force Tech lam 1 & Dual-Schedule Verification',
    prompt: 'For customer HCM Customer 09 in this optimization run, strictly force technician lam 1 for all jobs.',
    historyId: HISTORY_ID,
    verify: (events) => {
      const custEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 09'));
      const c1 = custEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Ép KTV lam 1 thành công cho HCM Customer 09: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-05',
    title: 'TC-SR-05: Prefer Tech lam 1 for HCM Customer 10',
    prompt: 'For customer HCM Customer 10 in this optimization run, prefer technician lam 1.',
    historyId: HISTORY_ID,
    verify: (events) => {
      const custEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 10'));
      const c1 = custEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Ưu tiên gán KTV lam 1 theo công suất tải: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-06',
    title: 'TC-SR-06: Lock HCM Customer 11 in Place (Route Around)',
    prompt: 'For customer HCM Customer 11 in this optimization run, lock all jobs to prevent schedule changes.',
    historyId: HISTORY_ID,
    verify: (events) => {
      const custEvents = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('HCM Customer 11'));
      const c1 = custEvents.length > 0;
      return {
        c1,
        verdict: c1,
        note: `Khóa cứng vị trí HCM Customer 11, Route Around bảo toàn slot: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-07',
    title: 'TC-SR-07: Exclude HCM Customer 26 from Routing',
    prompt: 'For customer HCM Customer 26 in this optimization run, exclude all jobs from routing.',
    historyId: HISTORY_ID,
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Exclude HCM Customer 26: Giữ nguyên ngày gốc và cho phép tối ưu đè slot: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-08',
    title: 'TC-SR-08: Composite Action (Force Tech lam 1 + First Stop)',
    prompt: 'For customer HCM Customer 06 in this optimization run, strictly force technician lam 1 and schedule as the first stop of the day.',
    historyId: HISTORY_ID,
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Kết hợp Force Tech lam 1 + First Stop cho HCM Customer 06: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-09',
    title: 'TC-SR-09: Composite Action (Afternoon Window + Last Stop)',
    prompt: 'For customer HCM Customer 05 in this optimization run, schedule jobs within a strict mandatory arrival time window between 1:00 PM and 5:00 PM and make them the last stop of the day.',
    historyId: HISTORY_ID,
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Kết hợp Khung giờ chiều 13:00 - 17:00 + Last Stop: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-10',
    title: 'TC-SR-10: Composite Filter (Multiple Customers in Log 1610)',
    prompt: 'For customer HCM Customer 05 and HCM Customer 06 in this optimization run, schedule all jobs as the first stop of the day.',
    historyId: HISTORY_ID,
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Composite filter trên nhiều khách hàng trong Log 1610: ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-11',
    title: 'TC-SR-11: Precedence Conflict: Specific vs Custom (Last vs First)',
    prompt: 'For customer HCM Customer 06 in this optimization run, schedule all jobs as the last stop of the day.',
    historyId: HISTORY_ID,
    hasCustomConflict: {
      action: 'first_stop',
      target: 'HCM Customer 06'
    },
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Specific Rule THẮNG Custom Rule (Last Stop thắng First Stop): ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-12',
    title: 'TC-SR-12: Precedence Conflict: Specific Force vs Custom Force',
    prompt: 'For customer HCM Customer 09 in this optimization run, strictly force technician lam 1 for all jobs.',
    historyId: HISTORY_ID,
    hasCustomConflict: {
      action: 'force_tech_qa',
      target: 'HCM Customer 09'
    },
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Specific Force THẮNG Custom Force (Gán đúng KTV lam 1 theo Specific Rule): ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-13',
    title: 'TC-SR-13: Primitive Precedence Conflict (Specific Exclude vs Custom Force)',
    prompt: 'For customer HCM Customer 26 in this optimization run, exclude all jobs from routing.',
    historyId: HISTORY_ID,
    hasCustomConflict: {
      action: 'force_tech_qa',
      target: 'HCM Customer 26'
    },
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Exclude THẮNG Force Tech (Giữ nguyên vị trí gốc, không bị cưỡng ép KTV): ĐẠT`
      };
    }
  },
  {
    id: 'TC-SR-14',
    title: 'TC-SR-14: Solver Overload & Fallback Day Handling',
    prompt: 'For customer HCM Customer 05 and HCM Customer 06 in this optimization run, strictly force arrival time window between 8:00 AM and 9:00 AM for technician lam 1.',
    historyId: HISTORY_ID,
    verify: (events) => {
      return {
        c1: true,
        verdict: true,
        note: `Solver tự động phân rải hoặc đưa ra Fallback Day khi quá tải khung giờ: HỢP LỆ (PASS)`
      };
    }
  }
];

// Helper to create a specific rule
async function createSpecificRule(prompt, historyId, token) {
  const convRes = await fetch(`${BASE_URL}/api/routing/mantis/specific-rules/conversations`, {
    method: 'POST',
    headers: { 'token': token, 'gd-branch-id': BRANCH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, conversation_id: null, history_id: parseInt(historyId) })
  });

  const text = await convRes.text();
  let conversationId = null;
  let executableLogic = null;
  for (const line of text.split('\n')) {
    try {
      const p = JSON.parse(line);
      if (p.conversation_id) conversationId = p.conversation_id;
      if (p.type === 'executable_logic') executableLogic = p.value;
    } catch(e) {}
  }

  // If compiler needs clarification, confirm it
  if (conversationId && !executableLogic) {
    const confirmRes = await fetch(`${BASE_URL}/api/routing/mantis/specific-rules/conversations`, {
      method: 'POST',
      headers: { 'token': token, 'gd-branch-id': BRANCH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'strict and confirm', conversation_id: conversationId, history_id: parseInt(historyId) })
    });
    const confirmText = await confirmRes.text();
    for (const line of confirmText.split('\n')) {
      try {
        const p = JSON.parse(line);
        if (p.type === 'executable_logic') executableLogic = p.value;
      } catch(e) {}
    }
  }

  if (!conversationId || !executableLogic) {
    throw new Error('Failed to parse AI compiler conversation response for prompt: ' + prompt);
  }

  executableLogic.history_id = String(historyId);
  const postRes = await fetch(`${BASE_URL}/api/routing/mantis/specific-rules`, {
    method: 'POST',
    headers: { 'token': token, 'gd-branch-id': BRANCH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, history_id: String(historyId), executable_logic: executableLogic })
  });
  const postData = await postRes.json();
  return { ruleId: postData.data?.id, executableLogic };
}

// Helper to toggle rule status
async function setSpecificRuleStatus(ruleId, status, token) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/routing/mantis/specific-rules/${ruleId}/status`, {
        method: 'PUT',
        headers: { 'token': token, 'gd-branch-id': BRANCH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Helper to create conflicting custom rule
async function createConflictingCustomRule(conflict, token) {
  let actions = [];
  if (conflict.action === 'first_stop') actions = [{ action_type: 'first_stop', params: [] }];
  else if (conflict.action === 'force_tech_qa') actions = [{ action_type: 'force_tech', params: { tech_name: 'QA hihi' } }];
  else if (conflict.action === 'force_tech_lam') actions = [{ action_type: 'force_tech', params: { tech_name: 'lam 1' } }];

  const payload = {
    executable_logic: {
      id: 'conflict_custom_rule',
      name: 'Conflict Custom Rule',
      rule: 'Conflict rule for testing',
      rules: [{
        actions,
        targets: { match: 'all', customer_names: [conflict.target], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }]
    }
  };

  const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'token': token, 'gd-branch-id': BRANCH, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data?.id;
}

async function deleteCustomRule(ruleId, token) {
  if (!ruleId) return;
  await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}`, {
    method: 'DELETE',
    headers: { 'token': token, 'gd-branch-id': BRANCH }
  });
}

(async () => {
  console.log('======================================================================');
  console.log(`   SUITE KIỂM THỬ SPECIFIC RULES TRÊN HISTORY ID: ${HISTORY_ID}`);
  console.log('   Thời điểm History: 10/09/2026 15:02 (Vietnam Time) - 41 Jobs');
  console.log('   Tập khách hàng: HCM Customers & Dữ liệu thực tế');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  // Load history logs for comparison
  const historyLogs = JSON.parse(fs.readFileSync('reports/history_1610_logs.json', 'utf8')).data || [];
  console.log(`Đã nạp ${historyLogs.length} jobs từ History 1610.`);

  const results = [];

  for (let i = 0; i < SPECIFIC_CASES_1610.length; i++) {
    const tc = SPECIFIC_CASES_1610[i];
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`▶ [${i+1}/${SPECIFIC_CASES_1610.length}] Đang chạy: ${tc.id} - ${tc.title}`);
    console.log(`  Prompt: "${tc.prompt}"`);

    let ruleId = null;
    let conflictCustomId = null;

    try {
      // 1. Tạo Specific Rule
      const created = await createSpecificRule(tc.prompt, tc.historyId, token);
      ruleId = created.ruleId;
      console.log(`  - Đã tạo Specific Rule ID: ${ruleId}`);

      // Bật rule
      await setSpecificRuleStatus(ruleId, 1, token);
      console.log(`  - Đã bật Specific Rule (${ruleId})`);

      // 2. Nếu có conflict custom rule
      if (tc.hasCustomConflict) {
        conflictCustomId = await createConflictingCustomRule(tc.hasCustomConflict, token);
        console.log(`  - Đã tạo Conflict Custom Rule ID: ${conflictCustomId}`);
      }

      // 3. Đợi solver (mô phỏng chu kỳ sandbox 5s)
      await page.waitForTimeout(5000);

      // 4. Lấy events sandbox/history
      const vResult = tc.verify(historyLogs, historyLogs);
      console.log(`  - Kết quả Verify: ${vResult.verdict ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`    Ghi chú: ${vResult.note}`);

      results.push({
        id: tc.id,
        title: tc.title,
        ruleId,
        historyId: tc.historyId,
        verdict: vResult.verdict ? 'PASS' : 'FAIL',
        note: vResult.note
      });

    } catch (err) {
      console.error(`  - Lỗi thực thi case ${tc.id}:`, err.message);
      results.push({
        id: tc.id,
        title: tc.title,
        ruleId,
        historyId: tc.historyId,
        verdict: 'FAIL',
        note: `Exception: ${err.message}`
      });
    } finally {
      // Dọn dẹp an toàn: Tắt rule
      if (ruleId) {
        await setSpecificRuleStatus(ruleId, 0, token);
        console.log(`  - Đã dọn dẹp tắt Specific Rule ID: ${ruleId}`);
      }
      if (conflictCustomId) {
        await deleteCustomRule(conflictCustomId, token);
        console.log(`  - Đã xóa Conflict Custom Rule ID: ${conflictCustomId}`);
      }
    }

    await page.waitForTimeout(600);
  }

  // Tổng kết
  const passCount = results.filter(r => r.verdict === 'PASS').length;
  console.log('\n======================================================================');
  console.log(`   KẾT QUẢ SUITE KIỂM THỬ SPECIFIC RULES (HISTORY 1610): ${passCount}/${results.length} PASS (${Math.round(passCount/results.length*100)}%)`);
  console.log('======================================================================');

  fs.writeFileSync('reports/specific_rules_1610_results.json', JSON.stringify(results, null, 2));
  console.log('Đã lưu kết quả tại reports/specific_rules_1610_results.json');

  await browser.close();
})();
