const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const SUITE_TEST_CASES = [
  {
    id: 'TC-CUSTOM-01',
    title: 'TC-CUSTOM-01: Customer 176 First Stop & test pool Last Stop',
    description: 'For customer 176 jobs, schedule as first stop. For customer test pool jobs, schedule as last stop.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['176'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['test pool'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // Đối soát trên tuyến của lam 1 ngày 09/10/2026
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      if (!oct9Lam1.length) return { c1: false, c2: false, verdict: false, note: 'Không có jobs trên ngày 09/10 cho lam 1' };
      const first = oct9Lam1[0];
      const last = oct9Lam1[oct9Lam1.length - 1];
      const firstCust = (first?.customer?.full_name || first?.customer?.name || '').trim();
      const lastCust = (last?.customer?.full_name || last?.customer?.name || '').trim();
      const c1 = firstCust.includes('176');
      const c2 = lastCust.includes('test pool');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Stop #1: "${firstCust}" (${first?.tile?.header}) | Stop cuối: "${lastCust}" (${last?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-CUSTOM-02',
    title: 'TC-CUSTOM-02: Initial Service Time Window 8-10AM & Call Back Last Stop',
    description: 'For Initial Service jobs schedule between 8AM and 10AM. For Call Back Service schedule as last stop.',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 28800, end_sec: 36000 }, action_type: 'time_window' }], // 8:00 AM - 10:00 AM
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // Kiểm tra Initial Service trong khoảng 8-10AM trên ngày 09/10
      const oct9 = events.filter(e => e.date_label === '10-09-2026');
      const initJobs = oct9.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Initial'));
      const c1 = initJobs.length > 0 && initJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('8:') || hdr.includes('9:') || hdr.includes('08:') || hdr.includes('09:');
      });
      // Kiểm tra Call Back là điểm dừng cuối của KTV lam 1 hoặc QA hihi
      const oct9Lam1 = oct9.filter(e => e.schedule?.name === 'lam 1').sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const oct9QA = oct9.filter(e => e.schedule?.name === 'QA hihi').sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const lastLam1 = oct9Lam1[oct9Lam1.length - 1];
      const lastQA = oct9QA[oct9QA.length - 1];
      const srvLam1 = lastLam1?.job_tiles?.find(t=>t.field==='service_type')?.value || lastLam1?.job?.title || '';
      const srvQA = lastQA?.job_tiles?.find(t=>t.field==='service_type')?.value || lastQA?.job?.title || '';
      const c2 = srvLam1.includes('Call Back') || srvQA.includes('Call Back');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Initial Service giờ: ${initJobs.map(j=>j.tile?.header).join(', ')} | Cuối ngày: lam 1="${srvLam1}", QA hihi="${srvQA}"`
      };
    }
  },
  {
    id: 'TC-CUSTOM-03',
    title: 'TC-CUSTOM-03: Customer qa 1 Force Tech lam 1 & Time Window 8-10AM',
    description: 'For customer qa 1 jobs, force technician lam 1 and schedule between 8:00 AM and 10:00 AM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['qa 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 28800, end_sec: 36000 }, action_type: 'time_window' }], // 8:00 AM - 10:00 AM
        targets: { match: 'all', customer_names: ['qa 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const qa1Jobs = events.filter(e => (e.customer?.full_name || e.customer?.name || '').toLowerCase().includes('qa 1'));
      if (!qa1Jobs.length) return { c1: false, c2: false, verdict: false, note: 'Không tìm thấy job của qa 1' };
      const c1 = qa1Jobs.every(j => j.schedule?.name === 'lam 1');
      const c2 = qa1Jobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('8:') || hdr.includes('9:') || hdr.includes('08:') || hdr.includes('09:') || hdr.includes('10:00');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `KTV gán: ${qa1Jobs.map(j=>j.schedule?.name).join(', ')} | Khung giờ: ${qa1Jobs.map(j=>j.tile?.header).join(', ')}`
      };
    }
  },
  {
    id: 'TC-CUSTOM-04',
    title: 'TC-CUSTOM-04: Every 21 Days Force Tech lam 1 & Quarterly Service Time Window 10AM-12PM',
    description: 'For Every 21 Days jobs, force technician lam 1. For Quarterly Service jobs, schedule between 10:00 AM and 12:00 PM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', service_types: ['Every 21 Days'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 36000, end_sec: 43200 }, action_type: 'time_window' }], // 10:00 AM - 12:00 PM
        targets: { match: 'all', service_types: ['Quarterly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const e21Jobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Every 21 Days'));
      const qJobs = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value || e.job?.title || '').includes('Quarterly'));
      const c1 = e21Jobs.length > 0 && e21Jobs.every(j => j.schedule?.name === 'lam 1');
      const c2 = qJobs.length > 0 && qJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('10:') || hdr.includes('11:') || hdr.includes('12:00');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Every 21 Days gán lam 1: ${c1 ? 'ĐỦ' : 'THIẾU'} (${e21Jobs.length} jobs) | Quarterly Service giờ: ${qJobs.map(j=>j.tile?.header).join(', ')}`
      };
    }
  },
  {
    id: 'TC-CUSTOM-05',
    title: 'TC-CUSTOM-05: Customer lam minh Time Window 1-3PM & Customer test qa First Stop',
    description: 'For customer lam minh jobs, schedule between 1:00 PM and 3:00 PM. For customer test qa jobs, schedule as first stop.',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 46800, end_sec: 54000 }, action_type: 'time_window' }], // 1:00 PM (46800) - 3:00 PM (54000)
        targets: { match: 'all', customer_names: ['lam minh'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['test qa'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const oct9Lam1 = events.filter(e => e.date_label === '10-09-2026' && e.schedule?.name === 'lam 1')
                             .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct9Lam1[0];
      const firstCust = (first?.customer?.full_name || first?.customer?.name || '').trim();
      const c2 = firstCust.includes('test qa');

      const lmJobs = oct9Lam1.filter(j => (j.customer?.full_name || j.customer?.name || '').toLowerCase().includes('lam minh'));
      const c1 = lmJobs.length > 0 && lmJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('1:') || hdr.includes('2:') || hdr.includes('13:') || hdr.includes('14:') || hdr.includes('15:00');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `test qa đầu ngày (#1): ${c2 ? 'CÓ' : 'KHÔNG'} (${firstCust} - ${first?.tile?.header}) | lam minh (1-3PM): ${c1 ? 'ĐÚNG' : 'SAI'} (${lmJobs.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-CUSTOM-06',
    title: 'TC-CUSTOM-06: Customer Specific test Force Tech QA hihi & Bi-Monthly First Stop',
    description: 'For customer Specific test jobs, force technician QA hihi. For Bi-Monthly Service jobs, schedule as first stop.',
    rules: [
      {
        actions: [{ params: { tech_name: 'QA hihi' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', service_types: ['Bi-Monthly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const oct9 = events.filter(e => e.date_label === '10-09-2026');
      const stJobs = oct9.filter(j => (j.customer?.full_name || j.customer?.name || '').toLowerCase().includes('specific test'));
      const c1 = stJobs.length > 0 && stJobs.every(j => j.schedule?.name === 'QA hihi');

      // Kiểm tra Bi-Monthly đứng đầu ngày của KTV tương ứng
      const biMonth = oct9.find(j => (j.job_tiles?.find(t=>t.field==='service_type')?.value || j.job?.title || '').includes('Bi-Monthly'));
      let c2 = false;
      if (biMonth) {
        const techJobs = oct9.filter(j => j.schedule?.name === biMonth.schedule?.name).sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
        c2 = techJobs[0]?.job?.id === biMonth.job?.id;
      }
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Specific test gán QA hihi: ${c1 ? 'ĐỦ' : 'THIẾU'} (${stJobs.length} jobs) | Bi-Monthly đầu ngày: ${c2 ? 'CÓ' : 'KHÔNG'} (${biMonth?.schedule?.name} - ${biMonth?.tile?.header})`
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
  console.log('   BẮT ĐẦU THỰC THI KIỂM THỬ CUSTOM RULES CHUYÊN NGHIỆP (6 CASES)');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   Chu trình 4 bước khép kín - Live Preview Chromium trực quan');
  console.log('   TIÊU CHÍ: ZERO FAKE PASS - 100% SỰ THẬT TỪ SOLVER NDJSON STREAM');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_custom_suite');
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

  for (let i = 0; i < SUITE_TEST_CASES.length; i++) {
    const tc = SUITE_TEST_CASES[i];
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

    // BƯỚC 2: Mantis Sandbox -> Chờ Solver 12s -> Verify NDJSON Stream
    console.log(`[Bước 2] Mantis Sandbox: Chờ Solver tối ưu hóa 12 giây...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step2_sandbox.png` });

    const events = await fetchSandboxEvents(token);
    const check = tc.verify(events);

    console.log(`   * Mệnh đề 1: ${check.c1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Mệnh đề 2: ${check.c2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Chi tiết: ${check.note}`);
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
  fs.writeFileSync('reports/custom_suite_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('          TỔNG KẾT KẾT QUẢ KIỂM THỬ CUSTOM RULES (6 CASES)           ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
