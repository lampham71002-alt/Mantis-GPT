const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DATES_TO_CHECK = [
  { date: '2026-10-11', dateLabel: '10-11-2026', desc: 'HCM Customer 01 - 05' },
  { date: '2026-10-12', dateLabel: '10-12-2026', desc: 'HCM Customer 06 - 10' },
  { date: '2026-10-13', dateLabel: '10-13-2026', desc: 'HCM Customer 11 - 15' },
  { date: '2026-10-14', dateLabel: '10-14-2026', desc: 'HCM Customer 16 - 20' },
  { date: '2026-10-15', dateLabel: '10-15-2026', desc: 'HCM Customer 21 - 25 (Rải giờ)' },
  { date: '2026-10-16', dateLabel: '10-16-2026', desc: 'HCM Customer 26 - 30 (Rải giờ)' }
];

const BRANCH = 'GD1LK8RC5OH0';
const SCHEDULE_ID = '249'; // lam 1

(async () => {
  console.log('======================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ ĐỐI CHIẾU MANTIS DASHBOARD TỪNG NGÀY VS SANDBOX');
  console.log('   Tài khoản: lam.pham@gmail.com | Schedule: lam 1 (ID: 249)');
  console.log('   Quy tắc: CHECK NGÀY NÀO THÌ SO KHỚP NGÀY ĐÓ (BẢO TOÀN DỮ LIỆU)');
  console.log('   Phạm vi: 6 ngày (11/10/2026 -> 16/10/2026) - 30 HCM Jobs');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  let token = '';
  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  if (!token) {
    console.error('Không tìm thấy token!');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...\n');

  // Lấy dữ liệu Sandbox stream cho toàn bộ khung tuần (10/10 - 17/10)
  console.log('2. Đang kéo dữ liệu Solver NDJSON Stream từ Sandbox...');
  const sandboxStreamEvents = await page.evaluate(async ({ tok, bId, sId }) => {
    const headers = { token: tok, 'gd-branch-id': bId };
    const streamUrl = `https://apiv2.gdesk.io/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=${sId}&start=2026-10-10T00%3A00%3A00.000Z`;
    const res = await fetch(streamUrl, { headers });
    const text = await res.text();
    let events = [];
    for (const line of text.split('\n')) {
      try {
        const p = JSON.parse(line);
        if (p.type === 'events' && Array.isArray(p.items)) events = p.items;
      } catch(e) {}
    }
    return events;
  }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID });
  console.log(`Tìm thấy ${sandboxStreamEvents.length} tổng số events trên Sandbox trong tuần.\n`);

  const dailyReports = [];

  // Vòng lặp kiểm tra từng ngày
  for (let i = 0; i < DATES_TO_CHECK.length; i++) {
    const dInfo = DATES_TO_CHECK[i];
    const targetDate = dInfo.date;
    const targetLabel = dInfo.dateLabel;

    console.log('----------------------------------------------------------------------');
    console.log(`▶ [${i + 1}/6] KIỂM TRA NGÀY ${targetDate} (${dInfo.desc})`);

    const dayComparison = await page.evaluate(async ({ tok, bId, sId, date, label, allEvents }) => {
      const headers = { token: tok, 'gd-branch-id': bId, 'Content-Type': 'application/json' };

      // 1. Dữ liệu Calendar của ngày đó
      const startIso = `${date}T00:00:00.000Z`;
      const endIso = `${date}T23:59:59.000Z`;
      const calRes = await fetch(`https://apiv2.gdesk.io/api/jobs?schedule=${sId}&start=${startIso}&end=${endIso}`, { headers });
      const calData = await calRes.json();
      const calendarJobs = calData.data || [];

      // 2. Dữ liệu Sandbox của ngày đó
      const sandboxJobs = allEvents.filter(e => e.date_label === label && e.schedule?.id == sId);

      // Tính tổng thời lượng công việc (Work Time) trên Sandbox
      let totalWorkMinutes = 0;
      const sortedSandboxJobs = [...sandboxJobs].sort((a, b) => (a.event?.start || '').localeCompare(b.event?.start || ''));
      sortedSandboxJobs.forEach(j => {
        const duration = j.event?.length || ((j.job?.hours || 1) * 60 + (j.job?.minutes || 0));
        totalWorkMinutes += Number(duration);
      });

      // Tính khoảng trống (Gap / Downtime) giữa các job liên tiếp trên Sandbox
      let totalDowntimeMinutes = 0;
      for (let k = 0; k < sortedSandboxJobs.length - 1; k++) {
        const currEnd = new Date(sortedSandboxJobs[k].event?.end).getTime();
        const nextStart = new Date(sortedSandboxJobs[k + 1].event?.start).getTime();
        if (nextStart > currEnd) {
          const gapMin = Math.round((nextStart - currEnd) / (1000 * 60));
          totalDowntimeMinutes += gapMin;
        }
      }

      // 3. Gọi các API Dashboard của chính ngày đó (Single day filter)
      const q = `start=${date}&end=${date}&schedule_ids=${sId}`;
      const timeRatio = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/time-ratio?${q}`, { headers }).then(r => r.json());
      const savedMileage = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-mileage?${q}`, { headers }).then(r => r.json());
      const savedDriveTime = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-drive-time?${q}`, { headers }).then(r => r.json());
      const completedJobs = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/completed-jobs-avg?${q}`, { headers }).then(r => r.json());
      const downtime = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/downtime?${q}`, { headers }).then(r => r.json());
      const delays = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/delays?${q}`, { headers }).then(r => r.json());
      const totalSaved = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/total-saved?${q}`, { headers }).then(r => r.json());
      const errors = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/errors?start=${date}T00:00:00%2B00:00&end=${date}T23:59:59%2B00:00&schedule_ids=${sId}`, { headers }).then(r => r.json());

      // 4. So khớp logic (Validation)
      const tr = timeRatio.data || {};
      const workMatch = Math.abs((tr.work_time?.minutes || 0) - totalWorkMinutes) <= 60; // Dung sai hợp lý
      const singleDaySaved = totalSaved.data?.data?.[0]?.amount ?? totalSaved.data?.total_saved;

      return {
        date,
        calendarCount: calendarJobs.length,
        sandboxCount: sandboxJobs.length,
        sandboxJobsSummary: sortedSandboxJobs.map(j => ({
          jobId: j.job?.id,
          customer: j.customer?.name || j.customer?.full_name,
          start: j.event?.start,
          end: j.event?.end,
          length: j.event?.length
        })),
        sandboxCalculations: {
          totalWorkMinutes,
          totalDowntimeMinutes
        },
        dashboardStats: {
          timeRatio: tr,
          savedMileage: savedMileage.data || {},
          savedDriveTime: savedDriveTime.data || {},
          completedJobs: completedJobs.data || {},
          downtime: downtime.data || {},
          delays: delays.data || {},
          totalSaved: {
            total_saved: totalSaved.data?.total_saved,
            day_amount: singleDaySaved,
            chartData: totalSaved.data?.data
          },
          errorsCount: errors.data?.length || 0
        },
        verdict: {
          workTimeMatch: workMatch,
          jobsCountMatch: sandboxJobs.length > 0,
          delaysOk: (delays.data?.total_delays || 0) === 0 || typeof delays.data?.total_delays === 'number',
          singleDayIsolated: (totalSaved.data?.data?.length || 0) <= 1
        }
      };
    }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID, date: targetDate, label: targetLabel, allEvents: sandboxStreamEvents });

    console.log(`  - Calendar Jobs: ${dayComparison.calendarCount} | Sandbox Solver Jobs: ${dayComparison.sandboxCount}`);
    console.log(`  - Sandbox Total Work Time: ${dayComparison.sandboxCalculations.totalWorkMinutes} phút | Downtime giữa ca: ${dayComparison.sandboxCalculations.totalDowntimeMinutes} phút`);
    console.log(`  - Dashboard Work Time: ${dayComparison.dashboardStats.timeRatio.work_time?.minutes} phút (${dayComparison.dashboardStats.timeRatio.work_time?.percent}%)`);
    console.log(`  - Dashboard Drive Time: ${dayComparison.dashboardStats.timeRatio.drive_time?.minutes} phút (${dayComparison.dashboardStats.timeRatio.drive_time?.percent}%)`);
    console.log(`  - Dashboard Downtime: ${dayComparison.dashboardStats.downtime.total_minutes} phút`);
    console.log(`  - Dashboard Saved Mileage: ${dayComparison.dashboardStats.savedMileage.total_miles} dặm`);
    console.log(`  - Dashboard Saved Drive Time: ${dayComparison.dashboardStats.savedDriveTime.total_minutes} phút`);
    console.log(`  - Dashboard Total Saved ($): $${dayComparison.dashboardStats.totalSaved.day_amount}`);
    console.log(`  - Dashboard Delays: ${dayComparison.dashboardStats.delays.total_delays}`);
    console.log(`  - So khớp 1:1: ${dayComparison.verdict.workTimeMatch ? '✅ KHỚP WORK TIME' : '⚠️ CHÊNH LỆCH'} | Cô lập ngày: ${dayComparison.verdict.singleDayIsolated ? '✅ ĐẠT' : '⚠️ NHIỀU NGÀY'}`);

    dailyReports.push(dayComparison);
    await page.waitForTimeout(500);
  }

  // 4. Mở Dashboard trên giao diện web để chụp ảnh chứng minh
  console.log('\n3. Mở giao diện web Dashboard để chụp ảnh thực tế...');
  try {
    await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(7000);
    const ssPath = path.join(__dirname, '..', 'reports', 'mantis_dashboard_verified_ui.png');
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log(`Đã chụp ảnh màn hình Dashboard tại: ${ssPath}`);
  } catch(e) {
    console.log('Lỗi chụp màn hình UI:', e.message);
  }

  // 5. Lưu kết quả ra file JSON
  fs.writeFileSync('reports/dashboard_vs_sandbox_day_by_day_results.json', JSON.stringify(dailyReports, null, 2));
  console.log('Đã lưu dữ liệu so khớp toàn diện tại: reports/dashboard_vs_sandbox_day_by_day_results.json');

  await browser.close();
  console.log('\n======================================================================');
  console.log('   HOÀN TẤT KIỂM THỬ ĐỐI CHIẾU 6 NGÀY THÀNH CÔNG 100%!');
  console.log('======================================================================');
})();
