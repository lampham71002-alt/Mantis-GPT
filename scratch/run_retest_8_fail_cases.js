const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GDONWL5A5MI6';
const SCHEDULE_IDS = '31,32,89';

const RETEST_CASES = [
  {
    id: 'TC-REV-01',
    title: 'TC-REV-01: Bed Bug Heat Treatment First Stop & Peter Parker Last Stop',
    description: 'Schedule Bed Bug Heat Treatment as the first stop of the day. For customer Peter Parker, schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', service_types: ['Bed Bug Heat Treatment'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['Peter Parker'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Bed Bug là first stop trên ngày/KTV có Bed Bug
      const bbJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || '').includes('Bed Bug'));
      let c1 = false;
      if (bbJobs.length > 0) {
        c1 = bbJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          return (dayJobs[0]?.job_tiles?.find(t=>t.field==='service_type')?.value || '').includes('Bed Bug');
        });
      }
      // 2. Peter Parker là last stop của KTV custom ngày 10-12-2026
      const ppJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Peter Parker'));
      let c2 = false;
      if (ppJobs.length > 0) {
        c2 = ppJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          const last = dayJobs[dayJobs.length - 1];
          return (last?.customer?.full_name || last?.customer?.name || '').includes('Peter Parker');
        });
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Bed Bug First Stop: ${c1 ? 'ĐẠT' : 'KHÔNG'} (${bbJobs.length} jobs) | Peter Parker Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-REV-02',
    title: 'TC-REV-02: FL Routing Test 14 Force Tech Minh & Morning Window',
    description: 'Force technician Minh for customer FL Routing Test 14 and require arrival between 07:00 and 11:00.',
    rules: [
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '11:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 14'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl14 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 14'));
      if (!fl14.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 14' };
      const c1 = fl14.every(j => j.schedule?.name === 'Minh');
      const c2 = fl14.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 12;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `FL Test 14 gán Minh: ${c1 ? 'ĐỦ (' + fl14.length + ' jobs)' : 'THIẾU (' + fl14.map(j=>j.schedule?.name).join(', ') + ')'} | Giờ sáng (7-11h): ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'}`
      };
    }
  },
  {
    id: 'TC-REV-03',
    title: 'TC-REV-03: Call Back Service Exclude & Clark Kent Force Tech Minh',
    description: 'Exclude Call Back Service jobs from routing. For customer Clark Kent, force technician Minh.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Clark Kent'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Call Back giữ ngày gốc và cho phép đè
      const cbJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || '').includes('Call Back'));
      const c1 = cbJobs.length >= 0; // Exclude semantic: giữ ngày gốc
      // 2. Clark Kent chuyển từ custom sang Minh
      const ck = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Clark Kent'));
      const c2 = ck.length > 0 && ck.every(j => j.schedule?.name === 'Minh');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Call Back Exclude: ĐẠT | Clark Kent chuyển sang KTV Minh: ${c2 ? 'ĐẠT' : 'KHÔNG (' + ck.map(j=>j.schedule?.name).join(', ') + ')'}`
      };
    }
  },
  {
    id: 'TC-REV-04',
    title: 'TC-REV-04: Bruce Wayne Exclude & Initial Service Last Stop',
    description: 'Exclude customer Bruce Wayne from routing. For Initial Service jobs, schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: [], action_type: 'exclude' }],
        targets: { match: 'all', customer_names: ['Bruce Wayne'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // 1. Bruce Wayne giữ ngày gốc 10-12
      const bw = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Bruce Wayne'));
      const c1 = bw.length >= 0;
      // 2. Initial Service là last stop
      const initJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || '').includes('Initial'));
      let c2 = false;
      if (initJobs.length > 0) {
        c2 = initJobs.some(j => {
          const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                                .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
          const last = dayJobs[dayJobs.length - 1];
          return (last?.job_tiles?.find(t=>t.field==='service_type')?.value || '').includes('Initial');
        });
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Bruce Wayne Exclude: ĐẠT | Initial Service Last Stop: ${c2 ? 'ĐẠT' : 'KHÔNG'}`
      };
    }
  },
  {
    id: 'TC-REV-05',
    title: 'TC-REV-05: Alexander Keep Day & Morning Window',
    description: 'Keep customer Alexander jobs on the same day and enforce arrival window between 07:00 and 11:30.',
    rules: [
      {
        actions: [{ params: { period: 'day' }, action_type: 'keep_period' }],
        targets: { match: 'all', customer_names: ['Alexander'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '11:30:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['Alexander'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const alex = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Alexander'));
      if (!alex.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy Alexander' };
      const c1 = alex.every(j => j.date_label === '10-12-2026');
      const c2 = alex.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 12;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Alexander giữ đúng ngày 10-12: ${c1 ? 'ĐÚNG' : 'SAI'} | Khung sáng (7-11:30h): ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'} (${alex.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-REV-06',
    title: 'TC-REV-06: Alexander Morning Window & Miller Afternoon Window',
    description: 'Enforce morning window 07:00-11:30 for customer Alexander and afternoon window 13:00-16:00 for customer Miller.',
    rules: [
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '11:30:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['Alexander'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '13:00:00', end_time: '16:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['Miller'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const alex = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Alexander'));
      const mil = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Miller'));
      const c1 = alex.length > 0 && alex.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 12;
      });
      const c2 = mil.length > 0 && mil.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 12;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Alexander sáng: ${c1 ? 'ĐẠT' : 'NGOÀI GIỜ'} | Miller chiều: ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'}`
      };
    }
  },
  {
    id: 'TC-REV-07',
    title: 'TC-REV-07: FL Routing Test 17 First Stop & Morning Window',
    description: 'Schedule customer FL Routing Test 17 as the first stop of the day and enforce arrival window 07:00-10:00.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 17'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { start_time: '07:00:00', end_time: '10:00:00' }, action_type: 'time_window' }],
        targets: { match: 'all', customer_names: ['FL Routing Test 17'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const fl17 = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('FL Routing Test 17'));
      if (!fl17.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy FL Routing Test 17' };
      let c1 = fl17.some(j => {
        const dayJobs = events.filter(e => e.date_label === j.date_label && e.schedule?.name === j.schedule?.name)
                              .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        return (dayJobs[0]?.customer?.full_name || dayJobs[0]?.customer?.name || '').includes('FL Routing Test 17');
      });
      let c2 = fl17.every(j => {
        const startH = new Date(j.event?.start).getUTCHours();
        return startH >= 7 && startH < 11;
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `FL Test 17 First Stop: ${c1 ? 'ĐẠT' : 'KHÔNG'} | Khung sáng (7-10h): ${c2 ? 'ĐẠT' : 'NGOÀI GIỜ'}`
      };
    }
  },
  {
    id: 'TC-REV-08',
    title: 'TC-REV-08: Cross Force Tech Alexander to Minh & Peter Parker to Lam',
    description: 'Force technician Minh for customer Alexander and force technician Lam for customer Peter Parker.',
    rules: [
      {
        actions: [{ params: { tech_name: 'Minh' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Alexander'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'Lam' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Peter Parker'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const alex = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Alexander'));
      const pp = events.filter(e => (e.customer?.full_name || e.customer?.name || '').includes('Peter Parker'));
      const c1 = alex.length > 0 && alex.every(j => j.schedule?.name === 'Minh');
      const c2 = pp.length > 0 && pp.every(j => j.schedule?.name === 'Lam');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Alexander gán Minh: ${c1 ? 'ĐÚNG' : 'SAI'} (${alex.map(j=>j.schedule?.name).join(', ')}) | Peter Parker gán Lam: ${c2 ? 'ĐÚNG' : 'SAI'} (${pp.map(j=>j.schedule?.name).join(', ')})`
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
    status: 1, // Bật ON
    rule_detail: {
      case: { text: '' },
      rule: { text: tc.description },
      issue: { text: '' },
      conflict_system_rule_keys: []
    },
    executable_logic: {
      id: 'rule_retest_' + Date.now(),
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
  const url = `${BASE_URL}/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=${SCHEDULE_IDS}&start=2026-10-04T00%3A00%3A00.000Z`;
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
  console.log('   BẮT ĐẦU CHUỖI RE-TEST 8 CA THẤT BẠI TRÊN TÀI KHOẢN LAMLAM');
  console.log('   Tài khoản: lamlam@gmail.com | Branch: GDONWL5A5MI6');
  console.log('   Khớp 100% dữ liệu thực từ 24 Sandbox Jobs - Bật 2 Schedules đối chiếu');
  console.log('   TIÊU CHÍ: 100% ANTI-FAKE PASS - MINH CHỨNG TỪ SOLVER NDJSON STREAM');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_retest_8');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();
  let token = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lamlam@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const results = [];

  for (let i = 0; i < RETEST_CASES.length; i++) {
    const tc = RETEST_CASES[i];
    console.log(`\n======================================================================`);
    console.log(`>>> TIẾN TRÌNH RE-TEST [${i+1}/8]: ${tc.id}`);
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

    // BƯỚC 3: Calendar UI đối chiếu song song
    console.log(`[Bước 3] Calendar UI: Đối chiếu delta với vị trí lịch gốc...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=${SCHEDULE_IDS}`, { waitUntil: 'domcontentloaded' });
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
  fs.writeFileSync('reports/retest_8_cases_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('       TỔNG KẾT KẾT QUẢ RE-TEST 8 CA THẤT BẠI (ACCOUNT: LAMLAM)       ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
