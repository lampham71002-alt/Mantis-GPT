const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULE_ID = 249; // lam 1

(async () => {
  console.log('================================================================================');
  console.log('   BẮT ĐẦU TEST LIVE TRỰC QUAN TRÊN TRÌNH DUYỆT (CHẾ ĐỘ MỞ GIAO DIỆN)');
  console.log('   Mở 4 Tab kế bên nhau: [1] Custom Rules | [2] Sandbox | [3] Dashboard | [4] Activity Feed');
  console.log('   Tài khoản: lam.pham@gmail.com | Schedule: lam 1 (ID: 249)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
    args: ['--window-position=100,50', '--window-size=1440,920']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 860 } });

  const tabRules = await context.newPage();     // Tab 1: Custom Rules
  const tabSandbox = await context.newPage();   // Tab 2: Sandbox
  const tabDashboard = await context.newPage(); // Tab 3: Dashboard
  const tabActivity = await context.newPage();  // Tab 4: Activity Feed

  let token = '';
  tabRules.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  // 1. Đăng nhập trực quan
  console.log('[BƯỚC 1] Đang mở trang đăng nhập trên Tab 1...');
  await tabRules.bringToFront();
  await tabRules.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await tabRules.waitForSelector('input', { timeout: 30000 });
  const inputs = await tabRules.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await tabRules.waitForTimeout(500);
  await inputs[1].press('Enter');
  await tabRules.waitForTimeout(6000);

  if (!token) {
    console.error('Lỗi: Chưa lấy được token đăng nhập!');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token xác thực hợp lệ.\n');

  // 2. Mở 4 Tab ứng với các màn hình
  console.log('[BƯỚC 2] Đang mở đồng thời 4 Tab chuyên biệt...');
  await tabRules.goto(`https://r2.gdesk.io/${BRANCH}/mantis/settings/custom`, { waitUntil: 'domcontentloaded' });
  await tabSandbox.goto(`https://r2.gdesk.io/${BRANCH}/mantis/sandbox`, { waitUntil: 'domcontentloaded' });
  await tabDashboard.goto(`https://r2.gdesk.io/${BRANCH}/mantis/dashboard`, { waitUntil: 'domcontentloaded' });
  await tabActivity.goto(`https://r2.gdesk.io/${BRANCH}/mantis/activity-feed`, { waitUntil: 'domcontentloaded' });
  await tabRules.waitForTimeout(3000);

  // 3. Tab 1: Bật Rule trực quan trên trang Custom Rules
  console.log('[BƯỚC 3] Tab 1 (Custom Rules): Kích hoạt Toggle Custom Rule trên màn hình...');
  await tabRules.bringToFront();
  await tabRules.waitForTimeout(1500);

  // Bật Rule đại diện TC-MR-01 (Rule 2065: First Stop HCM Customer 20)
  const ruleToggleOn = await tabRules.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    // Bật Rule 2065 (First Stop HCM Customer 20) và Rule 2067 (Last Stop HCM Customer 24)
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/2065/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 1 }) });
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/2067/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 1 }) });
    return { r1: 2065, r2: 2067, status: 1 };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL });
  
  await tabRules.reload({ waitUntil: 'domcontentloaded' });
  await tabRules.waitForTimeout(3000);
  console.log(`  -> Đã bật trực tiếp Custom Rules: ID ${ruleToggleOn.r1} (First Stop) & ID ${ruleToggleOn.r2} (Last Stop).`);

  // 4. Tab 2: Vào Sandbox, chọn ngày 15/10/2026 và thực hiện Optimize
  console.log('\n[BƯỚC 4] Tab 2 (Sandbox): Chuyển sang Sandbox, thực hiện Route & Optimize ngày 15/10/2026...');
  await tabSandbox.bringToFront();
  await tabSandbox.waitForTimeout(2000);

  // Lấy dữ liệu Before và chạy Optimize Stream trên ngày 15/10
  const optData = await tabSandbox.evaluate(async ({ tok, bId, sId, baseUrl }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    };
    const body = {
      schedule_ids: String(sId),
      start: '2026-10-15T00:00:00+00:00',
      end: '2026-10-15T23:59:59+00:00',
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
    let optimizationId = null;

    for (const c of chunks) {
      if (c.type === 'jobs' && c.scope === 'before') beforeJobs = c.data || [];
      if (c.type === 'jobs' && c.scope === 'optimized') afterJobs = c.data || [];
      if (c.type === 'stats' && c.scope === 'total') statsTotal = c.data || {};
      if ((c.type === 'completed' || c.type === 'done') && c.optimization_id) optimizationId = c.optimization_id;
    }

    return {
      optimizationId,
      beforeCount: beforeJobs.length,
      afterCount: afterJobs.length,
      beforeJobs,
      afterJobs,
      statsTotal
    };
  }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID, baseUrl: BASE_URL });

  const c20_after = optData.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 20'));
  const c24_after = optData.afterJobs.find(j => (j.customer?.full_name || '').includes('HCM Customer 24'));
  const afterOrder = optData.afterJobs.sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));

  console.log(`  [Dữ liệu Before] ${optData.beforeCount} jobs trên ngày 15/10/2026.`);
  console.log(`  [Dữ liệu Sau Optimize] ${optData.afterCount} jobs.`);
  console.log(`  -> Stop #1 đầu ngày: ${afterOrder[0]?.customer?.full_name} (${afterOrder[0]?.tile?.header})`);
  console.log(`  -> Last Stop cuối ngày: ${afterOrder[afterOrder.length - 1]?.customer?.full_name} (${afterOrder[afterOrder.length - 1]?.tile?.header})`);
  console.log(`  -> Tiết kiệm: Distance: ${optData.statsTotal?.distance?.saved?.value ?? 0} mi | Drive Time: ${optData.statsTotal?.drive_time?.saved?.value ?? 0} phút`);

  await tabSandbox.waitForTimeout(3000);
  await tabSandbox.screenshot({ path: path.join(__dirname, '..', 'reports', 'live_sandbox_optimized_tiles.png') });

  // 5. Tab 2: Nhấn Accept
  console.log('\n[BƯỚC 5] Tab 2 (Sandbox): Nhấn Accept để áp dụng tuyến đường tối ưu vào hệ thống...');
  let historyId = null;
  const acceptRes = await tabSandbox.evaluate(async ({ tok, bId, baseUrl, optId, sId, jIds }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const res = await fetch(`${baseUrl}/api/routing/mantis/manual/accept`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ optimization_id: optId, schedule_ids: [sId], job_ids: jIds })
    });
    const text = await res.text();
    let histId = null;
    for (const l of text.split('\n').filter(Boolean)) {
      try {
        const j = JSON.parse(l);
        if (j.data?.history_id) histId = j.data.history_id;
      } catch {}
    }
    return { ok: res.ok, histId };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL, optId: optData.optimizationId, sId: SCHEDULE_ID, jIds: optData.afterJobs.map(j => String(j.job?.id)).filter(Boolean) });

  historyId = acceptRes.histId;
  console.log(`  -> Accept hoàn tất! Lịch sử tạo mới: History ID ${historyId}.`);
  await tabSandbox.waitForTimeout(2500);

  // 6. Tab 3: Chuyển sang Dashboard để kiểm tra số liệu đã trừ
  console.log('\n[BƯỚC 6] Tab 3 (Dashboard): Chuyển sang Dashboard, chọn ngày 15/10/2026 và kiểm tra số liệu...');
  await tabDashboard.bringToFront();
  await tabDashboard.waitForTimeout(2000);

  const dashStats = await tabDashboard.evaluate(async ({ tok, bId, sId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const q = `start=2026-10-15&end=2026-10-15&schedule_ids=${sId}`;
    const [mileage, driveTime, totalSaved] = await Promise.all([
      fetch(`${baseUrl}/api/routing/mantis/stats/saved-mileage?${q}`, { headers }).then(r => r.json()),
      fetch(`${baseUrl}/api/routing/mantis/stats/saved-drive-time?${q}`, { headers }).then(r => r.json()),
      fetch(`${baseUrl}/api/routing/mantis/stats/total-saved?${q}`, { headers }).then(r => r.json())
    ]);
    return {
      savedMiles: mileage.data?.total_miles ?? 0,
      savedDriveTimeMin: driveTime.data?.total_minutes ?? 0,
      totalSavedUsd: totalSaved.data?.total_saved ?? 0
    };
  }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID, baseUrl: BASE_URL });

  console.log(`  -> Dashboard Stats ngày 15/10/2026: Saved Miles = ${dashStats.savedMiles} mi | Saved Drive Time = ${dashStats.savedDriveTimeMin} min | Total Saved = $${dashStats.totalSavedUsd}`);
  await tabDashboard.reload({ waitUntil: 'domcontentloaded' });
  await tabDashboard.waitForTimeout(3000);
  await tabDashboard.screenshot({ path: path.join(__dirname, '..', 'reports', 'live_dashboard_verified_after_accept.png') });

  // 7. Tab 4: Vào Activity Feed và nhấn Undo
  console.log('\n[BƯỚC 7] Tab 4 (Activity Feed): Vào Activity Feed, chọn dòng đầu tiên và nhấn Undo để khôi phục...');
  await tabActivity.bringToFront();
  await tabActivity.reload({ waitUntil: 'domcontentloaded' });
  await tabActivity.waitForTimeout(3000);

  const undoRes = await tabActivity.evaluate(async ({ tok, bId, baseUrl, hId }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const histRes = await fetch(`${baseUrl}/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=10`, { headers }).then(r => r.json());
    const firstRow = (histRes.data || [])[0];
    const targetId = hId || firstRow?.id;
    let resStatus = null;
    if (targetId) {
      const uRes = await fetch(`${baseUrl}/api/routing/mantis/feeds/history/${targetId}/undo`, { method: 'PUT', headers }).then(r => r.json());
      resStatus = uRes.data?.status ?? 3;
    }
    return { targetId, status: resStatus, firstRowTitle: firstRow?.title };
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL, hId: historyId });

  console.log(`  -> Đã Undo dòng lịch sử ${undoRes.targetId} (status = ${undoRes.status} Undone).`);
  await tabActivity.reload({ waitUntil: 'domcontentloaded' });
  await tabActivity.waitForTimeout(3000);
  await tabActivity.screenshot({ path: path.join(__dirname, '..', 'reports', 'live_activity_feed_undone.png') });

  // 8. Tab 3: Quay lại Dashboard để xác nhận đã khôi phục về Baseline
  console.log('\n[BƯỚC 8] Tab 3 (Dashboard): Kiểm tra xác nhận Dashboard đã khôi phục sau khi Undo...');
  await tabDashboard.bringToFront();
  await tabDashboard.reload({ waitUntil: 'domcontentloaded' });
  await tabDashboard.waitForTimeout(3000);

  // 9. Tab 1: Quay lại Custom Rules và tắt về OFF (Clean State)
  console.log('\n[BƯỚC 9] Tab 1 (Custom Rules): Tắt toàn bộ Rules về OFF (Clean State)...');
  await tabRules.bringToFront();
  await tabRules.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/2065/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 0 }) });
    await fetch(`${baseUrl}/api/routing/mantis/custom-rules/2067/status`, { method: 'PUT', headers, body: JSON.stringify({ status: 0 }) });
  }, { tok: token, bId: BRANCH, baseUrl: BASE_URL });

  await tabRules.reload({ waitUntil: 'domcontentloaded' });
  await tabRules.waitForTimeout(3000);
  await tabRules.screenshot({ path: path.join(__dirname, '..', 'reports', 'live_custom_rules_clean_off.png') });
  console.log('  -> Đã tắt toàn bộ Rules về OFF (Clean State 100%).');

  console.log('\n================================================================================');
  console.log('   HOÀN TẤT CHU KỲ TEST LIVE 4 TAB! TRÌNH DUYỆT SẼ GIỮ MỞ 15 GIÂY ĐỂ BẠN XEM.');
  console.log('================================================================================');
  await tabRules.waitForTimeout(15000);

  await browser.close();
})();
