const { chromium } = require('playwright');
const fs = require('fs');

async function checkDashboardDayVsSandbox() {
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

  const BRANCH = 'GD1LK8RC5OH0';
  const SCHEDULE_ID = '249'; // lam 1
  const TARGET_DATE = '2026-10-11'; // Ngày test mẫu

  console.log(`\n2. Đang kiểm tra đối chiếu ngày ${TARGET_DATE} giữa Dashboard và Sandbox...`);

  const results = await page.evaluate(async ({ tok, bId, sId, date }) => {
    const headers = { token: tok, 'gd-branch-id': bId, 'Content-Type': 'application/json' };

    // 1. Lấy dữ liệu Sandbox / Jobs trên Calendar của ngày đó
    const startIso = `${date}T00:00:00.000Z`;
    const endIso = `${date}T23:59:59.000Z`;
    const calRes = await fetch(`https://apiv2.gdesk.io/api/jobs?schedule=${sId}&start=${startIso}&end=${endIso}`, { headers });
    const calData = await calRes.json();
    const dayJobs = calData.data || [];

    // 2. Lấy dữ liệu Sandbox Autopilot Stream cho ngày đó
    const streamRes = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=${sId}&start=2026-10-10T00%3A00%3A00.000Z`, { headers });
    const streamText = await streamRes.text();
    let sandboxEvents = [];
    for (const line of streamText.split('\n')) {
      try {
        const p = JSON.parse(line);
        if (p.type === 'events' && Array.isArray(p.items)) {
          sandboxEvents = p.items;
        }
      } catch(e) {}
    }

    const sandboxDayJobs = sandboxEvents.filter(e => e.date_label === '10-11-2026');

    // 3. Lấy dữ liệu Dashboard cho chính ngày đó
    const timeRatio = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/time-ratio?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());
    const savedMileage = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-mileage?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());
    const savedDriveTime = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/saved-drive-time?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());
    const totalSaved = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/total-saved?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());
    const downtime = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/downtime?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());
    const delays = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/stats/delays?start=${date}&end=${date}&schedule_ids=${sId}`, { headers }).then(r => r.json());

    return {
      date,
      calendarJobsCount: dayJobs.length,
      calendarJobDetails: dayJobs.map(j => ({ id: j.id, customer: j.customer?.name, service: j.service?.name, start: j.start })),
      sandboxDayJobsCount: sandboxDayJobs.length,
      sandboxDayJobDetails: sandboxDayJobs.map(j => ({ id: j.job?.id, customer: j.customer?.name, start: j.event?.start })),
      dashboardStats: {
        timeRatio: timeRatio.data,
        savedMileage: savedMileage.data,
        savedDriveTime: savedDriveTime.data,
        totalSaved: totalSaved.data,
        downtime: downtime.data,
        delays: delays.data
      }
    };
  }, { tok: token, bId: BRANCH, sId: SCHEDULE_ID, date: TARGET_DATE });

  console.log('======================================================================');
  console.log(`   KẾT QUẢ ĐỐI CHIẾU NGÀY ${results.date} GIỮA SANDBOX VÀ DASHBOARD`);
  console.log('======================================================================');
  console.log(`- Số lượng Jobs trên Calendar ngày ${results.date}: ${results.calendarJobsCount} jobs`);
  console.log(`- Số lượng Jobs trên Sandbox ngày ${results.date}: ${results.sandboxDayJobsCount} jobs`);
  console.log('\n--- DỮ LIỆU DASHBOARD THEO NGÀY ---');
  console.log('Time Ratio:', JSON.stringify(results.dashboardStats.timeRatio));
  console.log('Saved Mileage:', JSON.stringify(results.dashboardStats.savedMileage));
  console.log('Saved Drive Time:', JSON.stringify(results.dashboardStats.savedDriveTime));
  console.log('Total Saved ($):', JSON.stringify(results.dashboardStats.totalSaved));
  console.log('Downtime:', JSON.stringify(results.dashboardStats.downtime));
  console.log('Delays:', JSON.stringify(results.dashboardStats.delays));

  fs.writeFileSync('reports/dashboard_vs_sandbox_single_day.json', JSON.stringify(results, null, 2));

  await browser.close();
}

checkDashboardDayVsSandbox().catch(console.error);
