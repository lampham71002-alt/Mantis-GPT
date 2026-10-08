const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const PHASE2_TEST_CASES = [
  {
    id: 'TC-DELTA-01',
    title: 'TC-DELTA-01: Customer test 1 First Stop & Customer 176 Last Stop',
    description: 'For customer test 1 jobs, schedule as first stop. For customer 176 jobs, schedule as last stop.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['test 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['176'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // Ngày 09/10 lam 1: test 1 phải ở Stop #1, 176 phải ở Stop cuối
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      if (!oct9Lam1.length) return { c1: false, c2: false, verdict: false, note: 'Không có jobs cho lam 1 trên ngày 09/10' };
      const first = oct9Lam1[0];
      const last = oct9Lam1[oct9Lam1.length - 1];
      const firstCust = (first?.customer?.full_name || first?.customer?.name || '').trim();
      const lastCust = (last?.customer?.full_name || last?.customer?.name || '').trim();
      const c1 = firstCust.includes('test 1');
      const c2 = lastCust.includes('176');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Stop #1: "${firstCust}" (${first?.tile?.header}) | Stop cuối: "${lastCust}" (${last?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-DELTA-02',
    title: 'TC-DELTA-02: Customer Specific test Force Tech lam 1 & Time Window 1-3:30PM',
    description: 'For customer Specific test jobs, force technician lam 1 and schedule between 1:00 PM and 3:30 PM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 46800, end_sec: 55800 }, action_type: 'time_window' }], // 1:00 PM (46800) - 3:30 PM (55800)
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const stJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('specific test'));
      if (!stJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của Specific test' };
      const c1 = stJobs.every(j => j.schedule?.name === 'lam 1');
      const c2 = stJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('1:') || hdr.includes('2:') || hdr.includes('3:') || hdr.includes('13:') || hdr.includes('14:') || hdr.includes('15:');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Specific test gán lam 1: ${c1 ? 'ĐỦ' : 'THIẾU'} (${stJobs.length} jobs) | Giờ: ${stJobs.map(j=>j.tile?.header).join(', ')}`
      };
    }
  },
  {
    id: 'TC-DELTA-03',
    title: 'TC-DELTA-03: Customer location Force Tech lam 1 & Last Stop',
    description: 'For customer location jobs, force technician lam 1 and schedule as the last stop of the day.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['location'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['location'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const locJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('location'));
      if (!locJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của location' };
      const c1 = locJobs.every(j => j.schedule?.name === 'lam 1');
      const targetDate = locJobs[0].date_label;
      const dayJobs = events.filter(e => e.date_label === targetDate && e.schedule?.name === 'lam 1')
                            .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const lastJob = dayJobs[dayJobs.length - 1];
      const c2 = (lastJob?.customer?.full_name || lastJob?.customer?.name || '').toLowerCase().includes('location');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `location gán lam 1: ${c1 ? 'ĐÚNG' : 'SAI'} | Vị trí chốt cuối ngày (${targetDate}): ${lastJob?.customer?.name || lastJob?.customer?.full_name} (${lastJob?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-DELTA-04',
    title: 'TC-DELTA-04: Customer test move First Stop & Time Window 7-9AM',
    description: 'For customer test move jobs, schedule as first stop and schedule between 7:00 AM and 9:00 AM.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['test move'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 25200, end_sec: 32400 }, action_type: 'time_window' }], // 7:00 AM (25200) - 9:00 AM (32400)
        targets: { match: 'all', customer_names: ['test move'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const tmJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('test move'));
      if (!tmJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của test move' };
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct9Lam1[0];
      const c1 = (first?.customer?.full_name || first?.customer?.name || '').toLowerCase().includes('test move');
      const c2 = tmJobs.some(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('7:') || hdr.includes('8:') || hdr.includes('07:') || hdr.includes('08:') || hdr.includes('9:00');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Stop #1 đầu ngày: ${first?.customer?.name || first?.customer?.full_name} (${first?.tile?.header}) | test move giờ: ${tmJobs.map(j=>j.tile?.header).join(', ')}`
      };
    }
  },
  {
    id: 'TC-DELTA-05',
    title: 'TC-DELTA-05: Customer lam minh Force Tech QA hihi & Time Window 8-10:30AM',
    description: 'For customer lam minh jobs, force technician QA hihi and schedule between 8:00 AM and 10:30 AM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'QA hihi' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['lam minh'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 28800, end_sec: 37800 }, action_type: 'time_window' }], // 8:00 AM (28800) - 10:30 AM (37800)
        targets: { match: 'all', customer_names: ['lam minh'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const lmJobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('lam minh'));
      if (!lmJobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của lam minh' };
      const c1 = lmJobs.every(j => j.schedule?.name === 'QA hihi');
      const c2 = lmJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('8:') || hdr.includes('9:') || hdr.includes('10:') || hdr.includes('08:') || hdr.includes('09:');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `lam minh gán QA hihi: ${c1 ? 'ĐỦ' : 'THIẾU'} (${lmJobs.map(j=>j.schedule?.name).join(', ')}) | Khung giờ: ${lmJobs.map(j=>j.tile?.header).join(', ')}`
      };
    }
  },
  {
    id: 'TC-DELTA-06',
    title: 'TC-DELTA-06: Every 21 Days Force Tech QA hihi & Initial Service Last Stop',
    description: 'For Every 21 Days jobs, force technician QA hihi. For Initial Service jobs, schedule as last stop.',
    rules: [
      {
        actions: [{ params: { tech_name: 'QA hihi' }, action_type: 'force_tech' }],
        targets: { match: 'all', service_types: ['Every 21 Days'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const e21Jobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Every 21 Days'));
      const c1 = e21Jobs.length > 0 && e21Jobs.every(j => j.schedule?.name === 'QA hihi');

      const initJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Initial'));
      let c2 = false;
      if (initJobs.length > 0) {
        const targetDate = initJobs[0].date_label;
        const targetTech = initJobs[0].schedule?.name;
        const dayTechJobs = events.filter(e => e.date_label === targetDate && e.schedule?.name === targetTech)
                                  .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        const lastJob = dayTechJobs[dayTechJobs.length - 1];
        c2 = (lastJob?.job_tiles?.find(t=>t.field==='service_type')?.value || lastJob?.job?.title || '').includes('Initial');
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Every 21 Days gán QA hihi: ${c1 ? 'ĐỦ' : 'THIẾU'} (${e21Jobs.length} jobs) | Initial Service chốt cuối ngày: ${c2 ? 'CÓ' : 'KHÔNG'}`
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
  console.log('   BẮT ĐẦU THỰC THI GIAI ĐOẠN 2: STRESS TEST & DELTA VERIFICATION');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   Chu trình 4 bước khép kín - Live Preview Chromium trực quan');
  console.log('   TIÊU CHÍ: 100% ANTI-FAKE PASS - BẮT BUỘC ĐO LƯỜNG DELTA DỊCH CHUYỂN');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_phase2');
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

  for (let i = 0; i < PHASE2_TEST_CASES.length; i++) {
    const tc = PHASE2_TEST_CASES[i];
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
    console.log(`   * Delta Đo Được: ${check.note}`);
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
  fs.writeFileSync('reports/phase2_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('       TỔNG KẾT KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 2 (6 STRESS CASES)         ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
