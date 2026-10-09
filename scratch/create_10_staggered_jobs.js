const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const NEW_CUSTOMERS_FILE = path.join(__dirname, '..', 'reports', 'hcm_10_more_customers_created.json');
const OUTPUT_JOBS_FILE = path.join(__dirname, '..', 'reports', 'hcm_10_more_jobs_staggered.json');

// Khung giờ rải đều trong ngày làm việc (không trùng, không gom cục)
const TIME_SLOTS = [
  '08:00:00.000Z', // Slot 1: Sáng sớm (08:00 - 09:00)
  '09:30:00.000Z', // Slot 2: Giữa sáng (09:30 - 10:30)
  '11:00:00.000Z', // Slot 3: Trưa (11:00 - 12:00)
  '13:30:00.000Z', // Slot 4: Đầu chiều (13:30 - 14:30)
  '15:00:00.000Z'  // Slot 5: Xế chiều (15:00 - 16:00)
];

const DATES = [
  '2026-10-15', // Ngày 15/10: 5 jobs rải đều (HCM Customer 21 -> 25)
  '2026-10-16'  // Ngày 16/10: 5 jobs rải đều (HCM Customer 26 -> 30)
];

(async () => {
  console.log('======================================================================');
  console.log('   TẠO 10 JOBS RẢI ĐỀU THEO THỜI GIAN CHO 10 KHÁCH HÀNG MỚI (21 - 30)');
  console.log('   - 15/10/2026: 5 jobs rải các khung giờ 08:00, 09:30, 11:00, 13:30, 15:00');
  console.log('   - 16/10/2026: 5 jobs rải các khung giờ 08:00, 09:30, 11:00, 13:30, 15:00');
  console.log('   - Technician: lam 1 (Schedule ID: 249)');
  console.log('   - Dịch vụ: Initial Service (ID: 2539)');
  console.log('======================================================================\n');

  const customers = JSON.parse(fs.readFileSync(NEW_CUSTOMERS_FILE, 'utf8'));
  console.log(`Đã nạp ${customers.length} khách hàng mới từ file.`);

  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

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
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...');

  const createdJobs = [];

  console.log('\n2. Tiến hành lấy location và tạo Job rải đều khung giờ...');
  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const dayIndex = Math.floor(i / 5);
    const slotIndex = i % 5;
    const targetDate = DATES[dayIndex];
    const timeSlot = TIME_SLOTS[slotIndex];
    const isoDateTime = `${targetDate}T${timeSlot}`;

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

    // Tạo Job với giờ bắt đầu cụ thể
    const payload = {
      customer_id: cust.customerId,
      location_id: locationId,
      service_id: '2539', // Initial Service
      date: isoDateTime,  // Chuỗi ISO có giờ: ví dụ 2026-10-15T08:00:00.000Z
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
      const displayTime = timeSlot.substring(0, 5);
      console.log(`[${i + 1}/10] ${targetDate} ${displayTime} | ${cust.name} (${cust.district}) | CustID: ${cust.customerId} -> ✅ JOB ID: ${jobId}`);
      createdJobs.push({
        jobIndex: i + 1,
        jobId,
        date: targetDate,
        time: displayTime,
        isoDateTime,
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
      console.error(`[${i + 1}/10] ${targetDate} | ${cust.name} -> ❌ LỖI:`, JSON.stringify(jobRes));
    }

    await page.waitForTimeout(400);
  }

  console.log(`\n🎉 ĐÃ TẠO THÀNH CÔNG ${createdJobs.length}/${customers.length} JOBS RẢI ĐỀU KHUNG GIỜ!`);

  // Lưu file JSON
  fs.writeFileSync(OUTPUT_JOBS_FILE, JSON.stringify(createdJobs, null, 2), 'utf8');
  console.log(`Đã lưu kết quả tại: ${OUTPUT_JOBS_FILE}`);

  // 3. Mở Calendar kiểm tra tuần từ 11/10 đến 17/10
  console.log('\n3. Mở Calendar để chụp ảnh màn hình xác minh các khung giờ...');
  try {
    await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/calendar?schedules=249', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(7000);
    const calendarScreenshot = path.join(__dirname, '..', 'reports', 'hcm_10_staggered_jobs_calendar.png');
    await page.screenshot({ path: calendarScreenshot, fullPage: true });
    console.log(`Đã lưu ảnh màn hình Calendar tại: ${calendarScreenshot}`);
  } catch (e) {
    console.log('Lỗi chụp calendar UI:', e.message);
  }

  await browser.close();
  console.log('\n✅ HOÀN TẤT!');
})();
