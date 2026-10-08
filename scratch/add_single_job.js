const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--window-position=920,0', '--window-size=1000,1040']
  });
  const page = await browser.newPage();
  let authToken = '';

  page.on('request', req => {
    const headers = req.headers();
    if (headers['token']) authToken = headers['token'];
  });

  console.log('1. Đang đăng nhập lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputElements = await page.locator('input').all();
  await inputElements[0].fill('lam.pham@gmail.com');
  await inputElements[1].fill('Ahihi123');
  await inputElements[1].press('Enter');
  await page.waitForTimeout(6000);

  console.log('Đã đăng nhập thành công!');
  console.log('Token:', authToken);

  // Chọn khách hàng đầu tiên: 176 (ID: 1098, Location: 1144, Service: 2540)
  // Tạo job vào ngày 2026-10-08 cho schedule lam 1 (ID: 249)
  const targetCustomer = {
    id: '1098',
    name: '176',
    locationId: '1144',
    serviceId: '2540'
  };

  console.log('2. Tiến hành add trước 1 job cho Customer:', targetCustomer.name);
  console.log('   - Schedule: lam 1 (ID: 249)');
  console.log('   - Ngày: 2026-10-08');
  console.log('   - Customer ID:', targetCustomer.id);
  console.log('   - Location ID:', targetCustomer.locationId);

  const payload = {
    customer_id: targetCustomer.id,
    location_id: targetCustomer.locationId,
    service_id: targetCustomer.serviceId,
    date: '2026-10-08',
    hours: '1',
    minutes: '00',
    primary_schedule_id: '249'
  };

  const createRes = await fetch('https://apiv2.gdesk.io/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token: authToken },
    body: JSON.stringify(payload)
  });
  const createData = await createRes.json();
  console.log('Kết quả tạo Job:', createRes.status, createData);

  // Mở Calendar trên giao diện trực quan để hiển thị cho User xem
  console.log('3. Mở Calendar kiểm tra trực quan job vừa tạo...');
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/calendar?schedules=249');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'reports/added_1_job_calendar.png' });
  console.log('Đã lưu ảnh màn hình Calendar: reports/added_1_job_calendar.png');

  // Đóng browser
  await browser.close();
})();
