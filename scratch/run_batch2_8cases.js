const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOKEN = 'iLsDvRyiVGzqPBI0hDr2GylGdkMKRmxzrB1gaEAw2yLVMLxZvelX1JJClQw5halYNsGeXqd6U9Lzv0b0gZk2XXpRUGNasfCZP2TvHZP6mcFD6tvMNNHK24G2zymKhNq6843613741791355577';
const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

const TEST_CASES = [
  {
    id: 'TC-06R',
    title: 'TC-06R: Customer 176 First Stop & Customer test qa Last Stop',
    description: 'For customer 176 jobs, schedule as first stop. For customer test qa jobs, schedule as last stop.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['176'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', customer_names: ['test qa'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // Ngày 13/10
      const oct13 = events.filter(e => e.date_label === '10-13-2026' && e.schedule?.name === 'lam 1')
                          .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct13[0];
      const last = oct13[oct13.length - 1];
      const firstCust = (first?.customer?.name || first?.map_tiles?.find(m=>m.field==='customer_name')?.value || '').trim();
      const lastCust = (last?.customer?.name || last?.map_tiles?.find(m=>m.field==='customer_name')?.value || '').trim();
      const c1 = firstCust.includes('176');
      const c2 = lastCust.includes('test qa');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Stop đầu: "${firstCust}" (${first?.tile?.header}) | Stop cuối: "${lastCust}" (${last?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-07R',
    title: 'TC-07R: Monthly Service Force Tech lam 1 & qa 1 Time Window 7-9AM',
    description: 'For Monthly Service jobs force tech lam 1. For customer qa 1 jobs schedule between 7AM and 9AM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', service_types: ['Monthly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 25200, end_sec: 32400 }, action_type: 'time_window' }], // 7AM (25200) to 9AM (32400)
        targets: { match: 'all', customer_names: ['qa 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const monthly = events.filter(e => (e.job_tiles?.find(t=>t.field==='service_type')?.value||e.job?.title||'').includes('Monthly'));
      const c1 = monthly.length > 0 && monthly.every(m => m.schedule?.name === 'lam 1');
      const qa1Jobs = events.filter(e => (e.customer?.name||e.map_tiles?.find(m=>m.field==='customer_name')?.value||'').includes('qa 1'));
      const c2 = qa1Jobs.length > 0 && qa1Jobs.every(j => {
        const start = j.event?.start || '';
        const hdr = j.tile?.header || '';
        return (start.includes('07:') || start.includes('08:') || hdr.includes('7:') || hdr.includes('8:'));
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Monthly gán lam 1: ${c1 ? 'ĐỦ' : 'THIẾU'} (${monthly.length} jobs) | qa 1 trong 7-9AM: ${c2 ? 'ĐÚNG' : 'SAI'} (${qa1Jobs.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-08R',
    title: 'TC-08R: Customer test pool Force Tech lam 1 & Call Back Time Window 8-10AM',
    description: 'For customer test pool force tech lam 1. For Call Back Service schedule between 8AM and 10AM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['test pool'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 28800, end_sec: 36000 }, action_type: 'time_window' }], // 8AM (28800) to 10AM (36000)
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const poolJobs = events.filter(e => (e.customer?.name||e.map_tiles?.find(m=>m.field==='customer_name')?.value||'').includes('test pool'));
      const c1 = poolJobs.length > 0 && poolJobs.every(p => p.schedule?.name === 'lam 1');
      // Ngày 14/10 test pool Call Back
      const oct14CallBack = events.filter(e => e.date_label === '10-14-2026' && (e.job_tiles?.find(t=>t.field==='service_type')?.value||e.job?.title||'').includes('Call Back'));
      const c2 = oct14CallBack.length > 0 && oct14CallBack.every(j => {
        const start = j.event?.start || '';
        const hdr = j.tile?.header || '';
        return (start.includes('08:') || start.includes('09:') || hdr.includes('8:') || hdr.includes('9:'));
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `test pool KTV lam 1: ${c1 ? 'ĐÚNG' : 'SAI'} | Call Back ngày 14/10 (8-10AM): ${c2 ? 'ĐÚNG' : 'SAI'} (${oct14CallBack.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-09R',
    title: 'TC-09R: Initial Service Time Window 12-2PM & Call Back Service Last Stop',
    description: 'For Initial Service jobs schedule between 12PM and 2PM. For Call Back Service schedule as last stop.',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 43200, end_sec: 50400 }, action_type: 'time_window' }], // 12PM (43200) to 2PM (50400)
        targets: { match: 'all', service_types: ['Initial Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'last_stop' }],
        targets: { match: 'all', service_types: ['Call Back Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      // Ngày 08/10
      const oct08 = events.filter(e => e.date_label === '10-08-2026' && e.schedule?.name === 'lam 1')
                          .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const initJob = oct08.find(j => (j.job_tiles?.find(t=>t.field==='service_type')?.value||j.job?.title||'').includes('Initial'));
      const lastJob = oct08[oct08.length - 1];
      const initHeader = initJob?.tile?.header || initJob?.event?.start || '';
      const c1 = initHeader.includes('12:') || initHeader.includes('1:') || initHeader.includes('13:');
      const lastSrv = lastJob?.job_tiles?.find(t=>t.field==='service_type')?.value || lastJob?.job?.title || '';
      const c2 = lastSrv.includes('Call Back');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Initial Service giờ: "${initHeader}" | Stop cuối ngày 08/10: "${lastSrv}" (${lastJob?.tile?.header})`
      };
    }
  },
  {
    id: 'TC-10R',
    title: 'TC-10R: Customer Qa custom Force Tech lam 1 & Quarterly Service Time Window 8AM-12PM',
    description: 'For customer Qa custom force tech lam 1. For Quarterly Service schedule between 8AM and 12PM.',
    rules: [
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['Qa custom'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 28800, end_sec: 43200 }, action_type: 'time_window' }], // 8AM (28800) to 12PM (43200)
        targets: { match: 'all', service_types: ['Quarterly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const qaCustJobs = events.filter(e => (e.customer?.name||e.map_tiles?.find(m=>m.field==='customer_name')?.value||'').toLowerCase().includes('qa custom'));
      const c1 = qaCustJobs.length > 0 && qaCustJobs.every(j => j.schedule?.name === 'lam 1');
      // Ngày 08/10 Quarterly jobs của Qa custom
      const oct08Quarterly = qaCustJobs.filter(j => (j.job_tiles?.find(t=>t.field==='service_type')?.value||j.job?.title||'').includes('Quarterly'));
      const c2 = oct08Quarterly.length > 0 && oct08Quarterly.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('8:') || hdr.includes('9:') || hdr.includes('10:') || hdr.includes('11:') || hdr.includes('12:');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Qa custom KTV lam 1: ${c1 ? 'ĐÚNG' : 'SAI'} | Quarterly (8AM-12PM): ${c2 ? 'ĐÚNG' : 'SAI'} (${oct08Quarterly.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-11R',
    title: 'TC-11R: Bi-Monthly Service Time Window 7AM-12PM & Customer qa 1 Force Tech lam 1',
    description: 'For Bi-Monthly Service schedule between 7AM and 12PM. For customer qa 1 force tech lam 1.',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 25200, end_sec: 43200 }, action_type: 'time_window' }], // 7AM (25200) to 12PM (43200)
        targets: { match: 'all', service_types: ['Bi-Monthly Service'], customer_names: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { tech_name: 'lam 1' }, action_type: 'force_tech' }],
        targets: { match: 'all', customer_names: ['qa 1'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const qa1Jobs = events.filter(e => (e.customer?.name||e.map_tiles?.find(m=>m.field==='customer_name')?.value||'').toLowerCase().includes('qa 1'));
      const c2 = qa1Jobs.length > 0 && qa1Jobs.every(j => j.schedule?.name === 'lam 1');
      const biMonthOn13 = events.filter(e => e.date_label === '10-13-2026' && (e.job_tiles?.find(t=>t.field==='service_type')?.value||e.job?.title||'').includes('Bi-Monthly'));
      const c1 = biMonthOn13.length > 0 && biMonthOn13.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('7:') || hdr.includes('8:') || hdr.includes('9:') || hdr.includes('10:') || hdr.includes('11:') || hdr.includes('12:');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `Bi-Monthly (7AM-12PM) ngày 13/10: ${c1 ? 'ĐÚNG' : 'SAI'} (${biMonthOn13.map(j=>j.tile?.header).join(', ')}) | qa 1 gán lam 1: ${c2 ? 'ĐÚNG' : 'SAI'}`
      };
    }
  },
  {
    id: 'TC-12R',
    title: 'TC-12R: Customer Specific test Time Window 1-4PM & Customer test move First Stop',
    description: 'For customer Specific test schedule between 1PM and 4PM. For customer test move schedule as first stop.',
    rules: [
      {
        actions: [{ params: { strict: true, start_sec: 46800, end_sec: 57600 }, action_type: 'time_window' }], // 1PM (46800) to 4PM (57600)
        targets: { match: 'all', customer_names: ['Specific test'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['test move'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const oct08 = events.filter(e => e.date_label === '10-08-2026' && e.schedule?.name === 'lam 1')
                          .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct08[0];
      const firstCust = (first?.customer?.name || first?.map_tiles?.find(m=>m.field==='customer_name')?.value || '').trim();
      const c2 = firstCust.toLowerCase().includes('test move');
      const specJobs = oct08.filter(j => (j.customer?.name || j.map_tiles?.find(m=>m.field==='customer_name')?.value || '').toLowerCase().includes('specific test'));
      const c1 = specJobs.length > 0 && specJobs.every(j => {
        const hdr = j.tile?.header || '';
        return hdr.includes('1:') || hdr.includes('2:') || hdr.includes('3:') || hdr.includes('13:') || hdr.includes('14:') || hdr.includes('15:');
      });
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `test move đầu ngày (#1): ${c2 ? 'CÓ' : 'KHÔNG'} (${first?.tile?.header}) | Specific test (1-4PM): ${c1 ? 'ĐÚNG' : 'SAI'} (${specJobs.map(j=>j.tile?.header).join(', ')})`
      };
    }
  },
  {
    id: 'TC-13R',
    title: 'TC-13R: Customer lam minh First Stop & Customer location Time Window 11AM-2PM',
    description: 'For customer lam minh schedule as first stop. For customer location schedule between 11AM and 2PM.',
    rules: [
      {
        actions: [{ params: [], action_type: 'first_stop' }],
        targets: { match: 'all', customer_names: ['lam minh'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      },
      {
        actions: [{ params: { strict: true, start_sec: 39600, end_sec: 50400 }, action_type: 'time_window' }], // 11AM (39600) to 2PM (50400)
        targets: { match: 'all', customer_names: ['location'], service_types: [], statuses: [], customer_tags: [], region_labels: [], customer_addresses: [] }
      }
    ],
    verify: (events) => {
      const oct12 = events.filter(e => e.date_label === '10-12-2026' && e.schedule?.name === 'lam 1')
                          .sort((a,b) => (a.event?.start||'').localeCompare(b.event?.start||''));
      const first = oct12[0];
      const firstCust = (first?.customer?.name || first?.map_tiles?.find(m=>m.field==='customer_name')?.value || '').trim();
      const c1 = firstCust.toLowerCase().includes('lam minh');
      const locJob = oct12.find(j => (j.customer?.name || j.map_tiles?.find(m=>m.field==='customer_name')?.value || '').toLowerCase().includes('location'));
      const locHdr = locJob?.tile?.header || locJob?.event?.start || '';
      const c2 = locHdr.includes('11:') || locHdr.includes('12:') || locHdr.includes('1:') || locHdr.includes('13:');
      return {
        c1, c2,
        verdict: c1 && c2,
        note: `lam minh đầu ngày (#1): ${c1 ? 'CÓ' : 'KHÔNG'} (${first?.tile?.header}) | location (11AM-2PM): ${c2 ? 'ĐÚNG' : 'SAI'} (${locHdr})`
      };
    }
  }
];

async function createCustomRule(tc) {
  const convId = crypto.randomUUID();
  const payload = {
    conversation_id: convId,
    title: tc.title,
    description: tc.description,
    status: 1, // Bật ON ngay khi tạo để test
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
    headers: { 'Content-Type': 'application/json', token: TOKEN },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data?.id;
}

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
  console.log('   CHẠY TỰ ĐỘNG BỘ TEST CASE MỞ RỘNG (TC-06R ĐẾN TC-13R)');
  console.log('   Acc: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   CHU TRÌNH 4 BƯỚC KHÉP KÍN TRÊN LIVE PREVIEW CRHOMIUM');
  console.log('======================================================================\n');

  const reportDir = path.resolve(__dirname, '../reports/screenshots_batch2');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 250,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });

  const context = await browser.newContext({ viewport: { width: 980, height: 960 } });
  const page = await context.newPage();

  console.log('Đang đăng nhập hệ thống...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`>>> BẮT ĐẦU [${tc.id}]: ${tc.title}`);
    console.log(`----------------------------------------------------------------------`);

    // Bước 1: Tạo Rule và Bật ON
    console.log(`[Bước 1] Custom Rules: Tạo Rule & Bật ON...`);
    const ruleId = await createCustomRule(tc);
    console.log(` -> Đã tạo Rule ID: ${ruleId} (Status: ON)`);

    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step1_rule_on.png` });

    // Bước 2: Sandbox -> Chờ Solver 12s -> Verify NDJSON Stream
    console.log(`[Bước 2] Sandbox: Chờ Solver tối ưu hóa 12s...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step2_sandbox.png` });

    const events = await fetchSandboxEvents();
    const check = tc.verify(events);

    console.log(`   * Mệnh đề 1: ${check.c1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Mệnh đề 2: ${check.c2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   * Chi tiết: ${check.note}`);
    console.log(`   * Kết luận: ${check.verdict ? '✅ PASS' : '❌ FAIL'}`);

    results.push({
      id: tc.id,
      title: tc.title,
      ruleId,
      c1: check.c1,
      c2: check.c2,
      verdict: check.verdict ? 'PASS' : 'FAIL',
      note: check.note
    });

    // Bước 3: Calendar
    console.log(`[Bước 3] Calendar: Đối chiếu với lịch hiện tại...`);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/calendar?schedules=249,261,270,276,279`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step3_calendar.png` });

    // Bước 4: Tắt Toggle về OFF an toàn
    console.log(`[Bước 4] Custom Rules: TẮT RULE ${ruleId} về OFF an toàn...`);
    await setRuleStatus(ruleId, 0);
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${reportDir}/${tc.id}_step4_rule_off.png` });
  }

  await browser.close();

  // Lưu kết quả JSON
  fs.writeFileSync('reports/batch2_results.json', JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('              TỔNG KẾT KẾT QUẢ KIỂM THỬ BATCH 2 (8 CASES)            ');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`[${r.id}] (Rule ${r.ruleId}): ${r.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.note}`);
  });
  console.log('======================================================================\n');
})();
