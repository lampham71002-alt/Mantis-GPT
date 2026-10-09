const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CUSTOMERS_FILE = path.join(__dirname, '..', 'reports', 'hcm_20_customers_created.json');
const OUTPUT_JOBS_FILE = path.join(__dirname, '..', 'reports', 'hcm_20_jobs_created.json');

(async () => {
  console.log('======================================================================');
  console.log('   TẠO 20 JOBS CHO 20 KHÁCH HÀNG TP. HỒ CHÍ MINH (MỖI NGÀY 5 JOBS)');
  console.log('   Bắt đầu từ ngày 11/10/2026:');
  console.log('   - 11/10/2026: 5 jobs (HCM Customer 01 -> 05)');
  console.log('   - 12/10/2026: 5 jobs (HCM Customer 06 -> 10)');
  console.log('   - 13/10/2026: 5 jobs (HCM Customer 11 -> 15)');
  console.log('   - 14/10/2026: 5 jobs (HCM Customer 16 -> 20)');
  console.log('======================================================================\n');

  const customers = JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8'));
  console.log(`Đã nạp ${customers.length} khách hàng từ file.`);

  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage();

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
    console.error('Không tìm thấy token đăng nhập! Thử lấy từ request hoặc cookie...');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...');

  const dates = [
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14'
  ];

  const createdJobs = [];

  console.log('\n2. Tiến hành lấy location và tạo Job cho từng khách hàng...');
  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const dayIndex = Math.floor(i / 5);
    const targetDate = dates[dayIndex];

    // Lấy location_id
    const locRes = await page.evaluate(async ({ cid, tok }) => {
      const res = await fetch(`https://apiv2.gdesk.io/api/customers/${cid}/locations/simplify`, {
        headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
      });
      return await res.json();
    }, { cid: cust.customerId, tok: token });

    const locationId = locRes.data?.[0]?.id;
    if (!locationId) {
      console.error(`[Lỗi] Không tìm thấy location cho Customer ${cust.name} (ID: ${cust.customerId})`);
      continue;
    }

    // Tạo Job
    const payload = {
      customer_id: cust.customerId,
      location_id: locationId,
      service_id: '2539', // Initial Service
      date: targetDate,
      hours: '1',
      minutes: '00',
      primary_schedule_id: '249' // lam 1
    };

    const jobRes = await page.evaluate(async ({ pl, tok }) => {
      const res = await fetch('https://apiv2.gdesk.io/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' },
        body: JSON.stringify(pl)
      });
      return await res.json();
    }, { pl: payload, tok: token });

    if (jobRes.success && jobRes.data?.id) {
      const jobId = jobRes.data.id;
      console.log(`[${i + 1}/20] Ngày: ${targetDate} | ${cust.name} (${cust.district}) | CustID: ${cust.customerId} | LocID: ${locationId} -> ✅ JOB ID: ${jobId}`);
      createdJobs.push({
        jobIndex: i + 1,
        jobId,
        date: targetDate,
        customerIndex: cust.index,
        customerName: cust.name,
        customerId: cust.customerId,
        accountNo: cust.accountNo,
        locationId,
        address: cust.address,
        district: cust.district,
        serviceId: '2539',
        serviceName: 'Initial Service',
        scheduleId: '249',
        scheduleName: 'lam 1'
      });
    } else {
      console.error(`[${i + 1}/20] Ngày: ${targetDate} | ${cust.name} -> ❌ LỖI:`, JSON.stringify(jobRes));
    }

    await page.waitForTimeout(400);
  }

  console.log(`\n🎉 ĐÃ TẠO THÀNH CÔNG ${createdJobs.length}/${customers.length} JOBS!`);

  // Lưu file JSON
  fs.writeFileSync(OUTPUT_JOBS_FILE, JSON.stringify(createdJobs, null, 2), 'utf8');
  console.log(`Đã lưu kết quả tại: ${OUTPUT_JOBS_FILE}`);

  // 3. Mở Calendar kiểm tra tuần từ 11/10/2026 đến 14/10/2026
  console.log('\n3. Mở Calendar để chụp màn hình xác minh...');
  try {
    await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/calendar?schedules=249', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    const calendarScreenshot = path.join(__dirname, '..', 'reports', 'hcm_20_jobs_calendar.png');
    await page.screenshot({ path: calendarScreenshot, fullPage: true });
    console.log(`Đã lưu ảnh màn hình Calendar tại: ${calendarScreenshot}`);
  } catch (e) {
    console.log('Lỗi chụp calendar UI:', e.message);
  }

  await browser.close();
  console.log('\n✅ HOÀN TẤT!');
})();
