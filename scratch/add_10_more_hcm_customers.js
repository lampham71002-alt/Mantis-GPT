const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MORE_HCM_LOCATIONS = [
  { street: '100 Ham Nghi', ward: 'Ben Nghe', district: 'Quan 1', lat: 10.7712, lng: 106.7025 },
  { street: '2 Pasteur', ward: 'Ben Nghe', district: 'Quan 1', lat: 10.7700, lng: 106.7042 },
  { street: '32 Tran Quoc Thao', ward: 'Phuong 7', district: 'Quan 3', lat: 10.7812, lng: 106.6881 },
  { street: '500 Su Van Hanh', ward: 'Phuong 12', district: 'Quan 10', lat: 10.7750, lng: 106.6675 },
  { street: '150 Huynh Van Banh', ward: 'Phuong 12', district: 'Phu Nhuan', lat: 10.7925, lng: 106.6780 },
  { street: '200 Xo Viet Nghe Tinh', ward: 'Phuong 21', district: 'Binh Thanh', lat: 10.7980, lng: 106.7115 },
  { street: '12 Pho Quang', ward: 'Phuong 2', district: 'Tan Binh', lat: 10.8065, lng: 106.6660 },
  { street: '10 Nguyen Thi Thap', ward: 'Tan Hung', district: 'Quan 7', lat: 10.7410, lng: 106.7015 },
  { street: '50 Tran Nao', ward: 'An Khanh', district: 'Thu Duc', lat: 10.7985, lng: 106.7350 },
  { street: '200 Tran Hung Dao', ward: 'Phuong 11', district: 'Quan 5', lat: 10.7530, lng: 106.6650 }
];

async function add10MoreHcmCustomers() {
  console.log('======================================================================');
  console.log('   TIẾN TRÌNH TẠO THÊM 10 CUSTOMERS TẠI TP. HỒ CHÍ MINH, VIỆT NAM');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   Không gắn tag (tags: []) - Tọa độ Geocoded thực tế từng quận');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

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
  const createdCustomers = [];

  for (let i = 0; i < MORE_HCM_LOCATIONS.length; i++) {
    const loc = MORE_HCM_LOCATIONS[i];
    const customerNumber = 21 + i;
    const customerName = `HCM Customer ${customerNumber}`;

    console.log(`\n[${i+1}/10] Đang tạo khách hàng: ${customerName} (${loc.street}, ${loc.district})...`);

    const result = await page.evaluate(async ({ tok, bId, cName, locInfo, cNum }) => {
      // 1. Get auto account number
      let accNo = '';
      try {
        const initRes = await fetch('https://apiv2.gdesk.io/api/customers/init', {
          headers: { 'token': tok, 'gd-branch-id': bId }
        }).then(r => r.json());
        accNo = initRes.data?.number || '';
      } catch(e) {}

      const formattedAddr = `${locInfo.street}, ${locInfo.ward}, ${locInfo.district}, Thanh pho Ho Chi Minh, Ho Chi Minh 54401`;

      const payload = {
        profile: {
          account_no: accNo,
          first_name: cName,
          last_name: '',
          email: `hcm.customer${cNum}@example.com`,
          phones: [{ type: 'mobile', number: `0908${String(cNum).padStart(6, '0')}` }],
          source: '',
          tags: [], // Không gắn tag theo yêu cầu
          status: '1'
        },
        additional_contacts: [],
        cards: [],
        service_location: {
          location_note: `Khu vuc ${locInfo.district}`,
          billing_email: [],
          mdu: {},
          same_billing_location: true,
          billing_address: {
            bill_to: cName,
            street1: locInfo.street,
            street2: locInfo.ward,
            city: 'Thanh pho Ho Chi Minh',
            state: 'Ho Chi Minh',
            zip: '54401',
            country: 'Vietnam',
            county: locInfo.district,
            formattedAddress: formattedAddr,
            lng: locInfo.lng,
            lat: locInfo.lat
          },
          service_address: {
            street1: locInfo.street,
            street2: locInfo.ward,
            city: 'Thanh pho Ho Chi Minh',
            state: 'Ho Chi Minh',
            zip: '54401',
            country: 'Vietnam',
            county: locInfo.district,
            formattedAddress: formattedAddr,
            lng: locInfo.lng,
            lat: locInfo.lat
          },
          location_name: `Location ${locInfo.district}`,
          address_to: cName,
          messaging_preferences: {},
          wo_emails: []
        },
        fast_form: true
      };

      const res = await fetch('https://apiv2.gdesk.io/api/customers', {
        method: 'POST',
        headers: {
          'token': tok,
          'gd-branch-id': bId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      return {
        accNo,
        success: res.success,
        customerId: res.data?.customer_id,
        location: res.data?.location,
        message: res.message
      };
    }, { tok: token, bId: BRANCH, cName: customerName, locInfo: loc, cNum: customerNumber });

    if (result.success && result.customerId) {
      console.log(` -> ✅ THÀNH CÔNG: Customer ID: ${result.customerId} | Acc No: ${result.accNo}`);
      console.log(`    Địa chỉ: ${result.location?.address} (Lat: ${result.location?.lat}, Lng: ${result.location?.lng})`);
      createdCustomers.push({
        index: customerNumber,
        name: customerName,
        customerId: result.customerId,
        accountNo: result.accNo,
        street: loc.street,
        district: loc.district,
        address: result.location?.address,
        lat: result.location?.lat,
        lng: result.location?.lng,
        tags: []
      });
    } else {
      console.error(` -> ❌ THẤT BẠI:`, result.message);
    }

    await page.waitForTimeout(400);
  }

  // Save report for these 10 customers
  fs.writeFileSync('reports/hcm_10_more_customers_created.json', JSON.stringify(createdCustomers, null, 2));

  // Also merge with the previous 20 to have a complete list of 30 customers
  try {
    const prev20 = JSON.parse(fs.readFileSync('reports/hcm_20_customers_created.json', 'utf8'));
    const all30 = [...prev20, ...createdCustomers];
    fs.writeFileSync('reports/hcm_all_30_customers_created.json', JSON.stringify(all30, null, 2));
    console.log(`Đã gộp tổng cộng ${all30.length} khách hàng vào reports/hcm_all_30_customers_created.json`);
  } catch(e) {
    console.log('Lỗi gộp danh sách:', e.message);
  }

  // Navigate to UI Customers page to take screenshot
  console.log('\n2. Chụp ảnh màn hình danh bạ Customers trên UI...');
  try {
    await page.goto(`https://r2.gdesk.io/${BRANCH}/customers`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'reports/hcm_30_customers_ui.png', fullPage: true });
    console.log('Đã lưu ảnh màn hình UI tại: reports/hcm_30_customers_ui.png');
  } catch(e) {
    console.log('Lỗi chụp màn hình UI:', e.message);
  }

  console.log('\n======================================================================');
  console.log(`   HOÀN TẤT TẠO ${createdCustomers.length}/10 CUSTOMERS TIẾP THEO TẠI TP. HỒ CHÍ MINH!`);
  console.log('======================================================================');

  await browser.close();
}

add10MoreHcmCustomers().catch(console.error);
