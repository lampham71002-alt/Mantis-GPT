const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 10 Khách hàng hợp lệ (mỗi customer 1 job)
const BATCH_SCHEDULE = [
  // Ngày 1: 08/10/2026 (5 jobs)
  { date: '2026-10-08', customerId: '1098', locationId: '1144', customerName: '176', serviceId: '2540' },
  { date: '2026-10-08', customerId: '1154', locationId: '1223', customerName: 'test move', serviceId: '2540' },
  { date: '2026-10-08', customerId: '1175', locationId: '1262', customerName: 'Qa custom', serviceId: '2540' },
  { date: '2026-10-08', customerId: '1156', locationId: '1226', customerName: 'Specific test', serviceId: '2540' },
  { date: '2026-10-08', customerId: '1127', locationId: '1179', customerName: 'lam minh', serviceId: '2540' },

  // Ngày 2: 09/10/2026 (5 jobs)
  { date: '2026-10-09', customerId: '1099', locationId: '1145', customerName: 'location', serviceId: '2540' },
  { date: '2026-10-09', customerId: '1097', locationId: '1143', customerName: 'qa 1', serviceId: '2540' },
  { date: '2026-10-09', customerId: '1096', locationId: '1142', customerName: 'test qa', serviceId: '2540' },
  { date: '2026-10-09', customerId: '1164', locationId: '1239', customerName: 'test pool', serviceId: '2540' },
  { date: '2026-10-09', customerId: '1095', locationId: '1141', customerName: 'test 1', serviceId: '2540' }
];

(async () => {
  console.log('======================================================================');
  console.log('   TẠO HÀNG LOẠT JOBS CHO TỪNG CUSTOMER TRÊN SCHEDULE: lam 1 (ID: 249)');
  console.log('   Bắt đầu từ ngày 08/10/2026 | Mỗi ngày 5 jobs | Mỗi customer 1 job');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });
  const page = await browser.newPage();
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

  console.log('2. Đang tạo tuần tự từng Job cho từng Customer...');
  const createdJobs = [];

  for (let i = 0; i < BATCH_SCHEDULE.length; i++) {
    const item = BATCH_SCHEDULE[i];
    const payload = {
      customer_id: item.customerId,
      location_id: item.locationId,
      service_id: item.serviceId,
      date: item.date,
      hours: '1',
      minutes: '00',
      primary_schedule_id: '249'
    };

    const res = await fetch('https://apiv2.gdesk.io/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    const jobId = d.data?.id;
    console.log(`[Job ${i+1}/10] ${item.date} | Customer: "${item.customerName}" (ID: ${item.customerId}) -> ${d.success ? '✅ OK Job ID: ' + jobId : '❌ Lỗi: ' + JSON.stringify(d.message)}`);
    if (d.success) {
      createdJobs.push({
        jobId,
        date: item.date,
        customerName: item.customerName,
        customerId: item.customerId,
        locationId: item.locationId
      });
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n🎉 ĐÃ TẠO THÀNH CÔNG ${createdJobs.length}/${BATCH_SCHEDULE.length} JOBS!`);

  // 3. Mở Calendar kiểm tra và chụp ảnh toàn cảnh
  console.log('3. Mở Calendar kiểm tra trực quan trên màn hình...');
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/calendar?schedules=249');
  await page.waitForTimeout(6000);

  const screenshotPath = 'reports/batch_jobs_created_calendar.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Đã lưu ảnh màn hình Calendar tại: ${screenshotPath}`);

  // Lưu file JSON chi tiết các jobs đã tạo
  fs.writeFileSync('reports/created_jobs_summary.json', JSON.stringify(createdJobs, null, 2));

  await browser.close();
})();
