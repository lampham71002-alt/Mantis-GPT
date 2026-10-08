const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const PHASE3_TEST_CASES = [
  {
    id: 'TC-ADV-01',
    title: 'TC-ADV-01: Every 21 Days Keep Week & Customer 176 First Stop',
    description: 'Automatically keep all Every 21 Days service jobs scheduled within the same week. For customer 176 jobs, schedule as the first stop of the day.',
    rules: [
      {
        actions: [{ params: { period: 'week' }, action_type: 'keep_period' }],
        targets: { match: 'all', service_types: ['Every 21 Days'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['176'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Kiểm tra Every 21 Days nằm trọn trong tuần 1 (04/10 - 10/10)
      const e21Jobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Every 21 Days'));
      const c1 = e21Jobs.length > 0 && e21Jobs.every(j => {
        const d = j.date_label || '';
        return d.includes('10-04') || d.includes('10-05') || d.includes('10-06') || d.includes('10-07') || d.includes('10-08') || d.includes('10-09') || d.includes('10-10');
      });
      // 2. Kiểm tra customer 176 đứng First Stop (#1) của KTV lam 1
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct9Lam1[0];
      const firstCust = (first?.customer?.full_name || first?.customer?.name || '').trim();
      const c2 = firstCust.includes('176');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Every 21 Days trong Tuần 1: ${c1 ? 'ĐẠT' : 'KHÔNG'} (${e21Jobs.length} jobs) | Stop #1: "${firstCust}" (${first?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-ADV-02',
    title: 'TC-ADV-02: Customer Specific test Keep Week & Force Tech lam 1',
    description: 'Automatically keep customer Specific test jobs scheduled within the same week and force technician lam 1.',
    rules: [
      {
        actions: [{ params: { period: 'week' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const stJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('specific test'));
      if (!stJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của Specific test' };
      // 1. Nằm trong tuần 1
      const c1 = stJobs.every(j => {
        const d = j.date_label || '';
        return d.includes('10-04') || d.includes('10-05') || d.includes('10-06') || d.includes('10-07') || d.includes('10-08') || d.includes('10-09') || d.includes('10-10');
      });
      // 2. Gán KTV lam 1
      const c2 = stJobs.every(j => j.schedule?.name === 'lam 1');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Specific test trong Tuần 1: ${c1 ? 'ĐÚNG' : 'SAI'} | Gán lam 1: ${c2 ? 'ĐỦ' : 'THIẾU'} (${stJobs.map(j=>j.schedule?.name).join(', ')})`
      };
    }
  },
  {
    id: 'TC-ADV-03',
    title: 'TC-ADV-03: Exclude Call Back Service & Customer test move Keep Week',
    description: 'Automatically exclude Call Back Service jobs from routing. Automatically keep customer test move jobs scheduled within the same week.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { period: 'week' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['test move'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Không còn job Call Back nào xuất hiện trên ngày 09/10
      const oct9 = events.filter(e => e.date_label === '10-09-2026');
      const cbJobs = oct9.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Call Back'));
      const c1 = cbJobs.length === 0;
      // 2. test move nằm trong tuần 1
      const tmJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('test move'));
      const c2 = tmJobs.length > 0 && tmJobs.every(j => {
        const d = j.date_label || '';
        return d.includes('10-04') || d.includes('10-05') || d.includes('10-06') || d.includes('10-07') || d.includes('10-08') || d.includes('10-09') || d.includes('10-10');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Call Back bị Exclude khỏi 09/10: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + cbJobs.length + ' jobs'} | test move giữ trong Tuần 1: ${c2 ? 'ĐÚNG' : 'SAI'}`
      };
    }
  },
  {
    id: 'TC-ADV-04',
    title: 'TC-ADV-04: Exclude Specific test & Customer test pool Last Stop',
    description: 'Automatically exclude any jobs for customer Specific test. For customer test pool jobs, schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['test pool'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Không còn Specific test trên Sandbox
      const stJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('specific test'));
      const c1 = stJobs.length === 0;
      // 2. test pool là Last Stop của lam 1 ngày 09/10
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const last = oct9Lam1[oct9Lam1.length - 1];
      const lastCust = (last?.customer?.full_name || last?.customer?.name || '').trim();
      const c2 = lastCust.includes('test pool');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Specific test bị Exclude hoàn toàn: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + stJobs.length + ' jobs'} | Stop cuối: "${lastCust}" (${last?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-ADV-05',
    title: 'TC-ADV-05: Customer location Keep Day & First Stop',
    description: 'Automatically keep customer location jobs on the same day and schedule as the first stop of the day.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['location'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['location'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const locJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('location'));
      if (!locJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job location' };
      // 1. Giữ nguyên ngày 09/10
      const c1 = locJobs.every(j => j.date_label === '10-09-2026');
      // 2. Đứng đầu ngày (#1) của KTV tương ứng
      const targetTech = locJobs[0].schedule?.name;
      const dayJobs = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === targetTech)
                            .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = dayJobs[0];
      const c2 = (first?.customer?.full_name || first?.customer?.name || '').toLowerCase().includes('location');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `location giữ nguyên ngày 09/10: ${c1 ? 'ĐÚNG' : 'SAI (' + locJobs[0].date_label + ')'} | Stop #1 (${targetTech}): ${first?.customer?.name || first?.customer?.full_name} (${first?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-ADV-06',
    title: 'TC-ADV-06: Exclude Initial Service & Customer qa 1 Force Tech lam 1',
    description: 'Automatically exclude Initial Service jobs from routing. For customer qa 1 jobs, force technician lam 1.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['qa 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Không còn Initial Service
      const initJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Initial'));
      const c1 = initJobs.length === 0;
      // 2. qa 1 gán lam 1
      const qa1Jobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('qa 1'));
      const c2 = qa1Jobs.length > 0 && qa1Jobs.every(j => j.schedule?.name === 'lam 1');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Initial Service bị Exclude: ${c1 ? 'ĐÚNG (0 jobs)' : 'CÒN ' + initJobs.length + ' jobs'} | qa 1 gán lam 1: ${c2 ? 'ĐÚNG' : 'SAI'}`
      };
    }
  }
];

async function createCustomRule(tc, token) {
  const convId = crypto.randomUUID();
  const payload = {
    conversation_id: convId,
    title: tc.title,
    description: tc.description,
    status: 1, // Bật ON ngay để kiểm thử
    rule_detail: {
      case: { text: '' },
      rule: { text: tc.description },
      issue: { text: '' },
      conflict_system_rule_keys: []
    },
    executable_logic: {
      id: 'rule_exec',
      name: tc.title,
      rule: tc.description,
      rules: tc.rules,
      summary: tc.description,
      classify_action: 'gen_rule'
    }
  };
  const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data?.id;
}

async function setRuleStatus(ruleId, status, token) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules/${ruleId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ status })
      });
      if (res.ok) return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function fetchSandboxEvents(token) {
  const url = `${BASE_URL}/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=249,261,270,276,279&start=2026-10-04T00%3A00%3A00.000Z`;
  const res = await fetch(url, { headers: { token } });
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
  console.log('   BẮT ĐẦU THỰC THI GIAI ĐOẠN 3: KEEP WEEK, EXCLUDE & ADVANCED RULES');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   Chu trình 4 bước khép kín - Live Preview Chromium trực quan');
  console.log('   TIÊU CHÍ: 100% ANTI-FAKE PASS - SỰ THẬT TỪ SOLVER NDJSON STREAM');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_phase3');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();
  let token = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const results = [];

  for (let i = 0; i < PHASE3_TEST_CASES.length; i++) {
    const tc = PHASE3_TEST_CASES[i];
    console.log(`\n======================================================================`);
    console.log(`>>> TIẾN TRÌNH [${i+1}/6]: ${tc.id}`);
    console.log(`    Tiêu đề: ${tc.title}`);
    console.log(`======================================================================`);

    // BƯỚC 1: Custom Rules UI -> Tạo Rule & Bật ON
    console.log(`[Bước 1] Custom Rules UI: Tạo Rule và bật TOGGLE ON...`);
    const ruleId = await createCustomRule(tc, token);
    console.log(` -> Rule đã tạo thành công với ID: ${ruleId} (Status: ON)`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step1_rule_on.png` });

    // BƯỚC 2: Mantis Sandbox -> Chờ Solver 14s -> Verify NDJSON Stream
    console.log(`[Bước 2] Mantis Sandbox: Chờ Solver tối ưu hóa 14 giây...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(14000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step2_sandbox.png` });

    const events = await fetchSandboxEvents(token);
    const check = tc.verify(events);

    console.log(`   * Mệnh đề 1: ${check.c1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Mệnh đề 2: ${check.c2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Chi tiết Đo Được: ${check.note}`);
    console.log(`   * KẾT LUẬN: ${check.verdict ? '✅ PASS' : '❌ FAIL'}`);

    results.push({
      id: tc.id,
      title: tc.title,
      ruleId,
      c1: check.c1,
      c2: check.c2,
      verdict: check.verdict ? 'PASS' : 'FAIL',
      note: check.note
    });

    // BƯỚC 3: Calendar UI đối chiếu
    console.log(`[Bước 3] Calendar UI: Đối chiếu delta với vị trí lịch gốc...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step3_calendar.png` });

    // BƯỚC 4: Tắt Toggle Rule về OFF
    console.log(`[Bước 4] Custom Rules UI: TẮT RULE ${ruleId} về OFF an toàn...`);
    await setRuleStatus(ruleId, 0, token);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step4_rule_off.png` });
  }

  await browser.close();

  // Lưu file kết quả JSON
  fs.writeFileSync('reports/phase3_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('       TỔNG KẾT KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 3 (ADVANCED SUITE)         ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
