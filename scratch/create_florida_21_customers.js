const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apiv2.gdesk.io';
const BRANCH_ID = 'GDS8FT0L2NIW';

// 21 VỊ TRÍ CHUẨN XÁC TRÊN BẢN ĐỒ FLORIDA
const FLORIDA_LOCATIONS = [
  {
    city: 'Bartow',
    role: 'Depot / Base Marker E',
    county: 'Polk County',
    street: '450 N Wilson Ave',
    state: 'FL',
    zip: '33830',
    lat: 27.8964,
    lng: -81.8431,
    phone: '8635550101',
    tags: ['Florida', 'Polk County', 'Depot E']
  },
  {
    city: 'Ocala',
    role: 'Customer Location',
    county: 'Marion County',
    street: '110 SE Watula Ave',
    state: 'FL',
    zip: '34471',
    lat: 29.1872,
    lng: -82.1401,
    phone: '3525550102',
    tags: ['Florida', 'Marion County']
  },
  {
    city: 'Daytona Beach',
    role: 'Customer Location',
    county: 'Volusia County',
    street: '301 S Ridgewood Ave',
    state: 'FL',
    zip: '32114',
    lat: 29.2108,
    lng: -81.0228,
    phone: '3865550103',
    tags: ['Florida', 'Volusia County', 'Atlantic Coast']
  },
  {
    city: 'Sanford',
    role: 'Customer Location',
    county: 'Seminole County',
    street: '300 N Park Ave',
    state: 'FL',
    zip: '32771',
    lat: 28.8029,
    lng: -81.2695,
    phone: '4075550104',
    tags: ['Florida', 'Seminole County', 'Central FL']
  },
  {
    city: 'Titusville',
    role: 'Customer Location',
    county: 'Brevard County',
    street: '555 S Washington Ave',
    state: 'FL',
    zip: '32796',
    lat: 28.6122,
    lng: -80.8076,
    phone: '3215550105',
    tags: ['Florida', 'Brevard County', 'Space Coast']
  },
  {
    city: 'Orlando',
    role: 'Customer Location',
    county: 'Orange County',
    street: '400 S Orange Ave',
    state: 'FL',
    zip: '32801',
    lat: 28.5383,
    lng: -81.3792,
    phone: '4075550106',
    tags: ['Florida', 'Orange County', 'Central FL']
  },
  {
    city: 'Spring Hill',
    role: 'Customer Location',
    county: 'Hernando County',
    street: '7400 Spring Hill Dr',
    state: 'FL',
    zip: '34606',
    lat: 28.4764,
    lng: -82.5254,
    phone: '3525550107',
    tags: ['Florida', 'Hernando County', 'Gulf Coast']
  },
  {
    city: 'Tampa',
    role: 'Customer Location',
    county: 'Hillsborough County',
    street: '315 E Kennedy Blvd',
    state: 'FL',
    zip: '33602',
    lat: 27.9506,
    lng: -82.4572,
    phone: '8135550108',
    tags: ['Florida', 'Hillsborough County', 'Tampa Bay']
  },
  {
    city: 'Palm Bay',
    role: 'Customer Location',
    county: 'Brevard County',
    street: '120 Malabar Rd SE',
    state: 'FL',
    zip: '32907',
    lat: 28.0345,
    lng: -80.5887,
    phone: '3215550109',
    tags: ['Florida', 'Brevard County', 'Space Coast']
  },
  {
    city: 'Sebring',
    role: 'Customer Location',
    county: 'Highlands County',
    street: '368 S Commerce Ave',
    state: 'FL',
    zip: '33870',
    lat: 27.4956,
    lng: -81.4409,
    phone: '8635550110',
    tags: ['Florida', 'Highlands County', 'Central FL']
  },
  {
    city: 'Port Saint Lucie',
    role: 'Customer Location',
    county: 'St. Lucie County',
    street: '121 SW Port St Lucie Blvd',
    state: 'FL',
    zip: '34984',
    lat: 27.2730,
    lng: -80.3582,
    phone: '7725550111',
    tags: ['Florida', 'St. Lucie County', 'Treasure Coast']
  },
  {
    city: 'Bradenton',
    role: 'Customer Location',
    county: 'Manatee County',
    street: '101 Old Main St',
    state: 'FL',
    zip: '34205',
    lat: 27.4989,
    lng: -82.5748,
    phone: '9415550112',
    tags: ['Florida', 'Manatee County', 'Gulf Coast']
  },
  {
    city: 'Arcadia',
    role: 'Customer Location',
    county: 'DeSoto County',
    street: '23 N Polk Ave',
    state: 'FL',
    zip: '34266',
    lat: 27.2159,
    lng: -81.8584,
    phone: '8635550113',
    tags: ['Florida', 'DeSoto County']
  },
  {
    city: 'Sarasota',
    role: 'Customer Location',
    county: 'Sarasota County',
    street: '1565 1st St',
    state: 'FL',
    zip: '34236',
    lat: 27.3364,
    lng: -82.5307,
    phone: '9415550114',
    tags: ['Florida', 'Sarasota County', 'Gulf Coast']
  },
  {
    city: 'Punta Gorda',
    role: 'Customer Location',
    county: 'Charlotte County',
    street: '326 W Marion Ave',
    state: 'FL',
    zip: '33950',
    lat: 26.9298,
    lng: -82.0454,
    phone: '9415550115',
    tags: ['Florida', 'Charlotte County', 'Southwest FL']
  },
  {
    city: 'West Palm Beach',
    role: 'Customer Location',
    county: 'Palm Beach County',
    street: '401 Clematis St',
    state: 'FL',
    zip: '33401',
    lat: 26.7153,
    lng: -80.0534,
    phone: '5615550116',
    tags: ['Florida', 'Palm Beach County', 'Atlantic Coast']
  },
  {
    city: 'Fort Myers',
    role: 'Customer Location',
    county: 'Lee County',
    street: '2200 Second St',
    state: 'FL',
    zip: '33901',
    lat: 26.6406,
    lng: -81.8723,
    phone: '2395550117',
    tags: ['Florida', 'Lee County', 'Southwest FL']
  },
  {
    city: 'Naples',
    role: 'Customer Location',
    county: 'Collier County',
    street: '735 8th St S',
    state: 'FL',
    zip: '34102',
    lat: 26.1420,
    lng: -81.7948,
    phone: '2395550118',
    tags: ['Florida', 'Collier County', 'Southwest FL']
  },
  {
    city: 'Fort Lauderdale',
    role: 'Customer Location',
    county: 'Broward County',
    street: '100 N Andrews Ave',
    state: 'FL',
    zip: '33301',
    lat: 26.1224,
    lng: -80.1373,
    phone: '9545550119',
    tags: ['Florida', 'Broward County', 'Southeast FL']
  },
  {
    city: 'Miami',
    role: 'Customer Location',
    county: 'Miami-Dade County',
    street: '3500 Pan American Dr',
    state: 'FL',
    zip: '33133',
    lat: 25.7617,
    lng: -80.1918,
    phone: '3055550120',
    tags: ['Florida', 'Miami-Dade County', 'Southeast FL']
  },
  {
    city: 'Everglades Park',
    role: 'Customer Location (National Park)',
    county: 'Miami-Dade / Monroe',
    street: '40001 State Hwy 9336',
    state: 'FL',
    zip: '33034',
    lat: 25.3929,
    lng: -80.5840,
    phone: '3055550121',
    tags: ['Florida', 'Everglades', 'Far South']
  }
];

(async () => {
  console.log('======================================================================');
  console.log('   TIẾN TRÌNH TỰ ĐỘNG TẠO 21 CUSTOMERS CHO TOÀN BỘ LOCATIONS FLORIDA');
  console.log('   Tài khoản: minhlam@gmial.com | Branch: ' + BRANCH_ID);
  console.log('   Trạm gốc (Depot Marker E): Bartow, FL (27.8964, -81.8431)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--window-position=100,50', '--window-size=1440,920']
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
  let token = '';
  page.on('request', r => {
    const h = r.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập tài khoản minhlam@gmial.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('minhlam@gmial.com');
  await inputs[1].fill('Ahihi123456@');
  await page.waitForTimeout(500);
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  if (!token) {
    console.error('Không lấy được token xác thực!');
    await browser.close();
    process.exit(1);
  }
  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...\n');

  // Lấy danh sách khách hàng hiện có để tránh trùng lặp
  const existingCustomers = await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const res = await fetch(`${baseUrl}/api/customers?limit=100`, { headers }).then(r => r.json());
    return (res.data?.data || res.data || []).map(c => ({ id: c.id, name: c.full_name || c.first_name, address: c.address }));
  }, { tok: token, bId: BRANCH_ID, baseUrl: BASE_URL });

  console.log(`2. Số khách hàng hiện có trên hệ thống: ${existingCustomers.length}\n`);

  const createdResults = [];

  for (let i = 0; i < FLORIDA_LOCATIONS.length; i++) {
    const loc = FLORIDA_LOCATIONS[i];
    const customerName = `FL Customer - ${loc.city}`;

    // Kiểm tra xem khách hàng đã tồn tại chưa
    const existing = existingCustomers.find(c => (c.name || '').includes(loc.city));
    if (existing) {
      console.log(`[${i + 1}/${FLORIDA_LOCATIONS.length}] Khách hàng đã tồn tại: ${customerName} (ID: ${existing.id}) -> Bỏ qua`);
      createdResults.push({
        index: i + 1,
        city: loc.city,
        role: loc.role,
        customerName,
        customerId: existing.id,
        address: `${loc.street}, ${loc.city}, ${loc.state} ${loc.zip}`,
        lat: loc.lat,
        lng: loc.lng,
        county: loc.county,
        phone: loc.phone,
        status: 'Already Existed'
      });
      continue;
    }

    console.log(`[${i + 1}/${FLORIDA_LOCATIONS.length}] Đang tạo: ${customerName} (${loc.street}, ${loc.city}, ${loc.county})...`);

    const result = await page.evaluate(async ({ tok, bId, baseUrl, locInfo, cName }) => {
      const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };

      // 1. Lấy mã account number
      let accNo = '';
      try {
        const initRes = await fetch(`${baseUrl}/api/customers/init`, { headers }).then(r => r.json());
        accNo = initRes.data?.number || '';
      } catch (e) {}

      const formattedAddr = `${locInfo.street}, ${locInfo.city}, ${locInfo.state} ${locInfo.zip}, USA`;

      // 2. Tạo customer payload
      const payload = {
        profile: {
          account_no: accNo,
          first_name: cName,
          last_name: '',
          email: `fl.${locInfo.city.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
          phones: [{ type: 'mobile', number: locInfo.phone }],
          source: 0,
          tags: locInfo.tags,
          status: '1'
        },
        additional_contacts: [],
        cards: [],
        service_location: {
          location_note: locInfo.role,
          billing_email: [],
          mdu: {},
          same_billing_location: true,
          billing_address: {
            bill_to: cName,
            street1: locInfo.street,
            street2: '',
            city: locInfo.city,
            state: locInfo.state,
            zip: locInfo.zip,
            country: 'United States',
            county: locInfo.county,
            formattedAddress: formattedAddr,
            lng: locInfo.lng,
            lat: locInfo.lat
          },
          service_address: {
            street1: locInfo.street,
            street2: '',
            city: locInfo.city,
            state: locInfo.state,
            zip: locInfo.zip,
            country: 'United States',
            county: locInfo.county,
            formattedAddress: formattedAddr,
            lng: locInfo.lng,
            lat: locInfo.lat
          },
          location_name: `Location ${locInfo.city}`,
          address_to: cName,
          messaging_preferences: {},
          wo_emails: []
        },
        fast_form: true
      };

      const res = await fetch(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).then(r => r.json());

      return {
        success: res.success,
        customerId: res.data?.customer_id,
        accountNo: accNo,
        error: res.message
      };
    }, { tok: token, bId: BRANCH_ID, baseUrl: BASE_URL, locInfo: loc, cName: customerName });

    if (result.success) {
      console.log(`    ✅ Đã tạo thành công -> Customer ID: ${result.customerId} | Acc No: ${result.accountNo}`);
      createdResults.push({
        index: i + 1,
        city: loc.city,
        role: loc.role,
        customerName,
        customerId: result.customerId,
        accountNo: result.accountNo,
        address: `${loc.street}, ${loc.city}, ${loc.state} ${loc.zip}`,
        lat: loc.lat,
        lng: loc.lng,
        county: loc.county,
        phone: loc.phone,
        status: 'Created'
      });
    } else {
      console.error(`    ❌ Lỗi tạo khách hàng:`, result.error);
    }

    await page.waitForTimeout(500);
  }

  // Lưu file JSON kết quả
  const jsonPath = path.join(__dirname, '..', 'reports', 'florida_21_customers_created.json');
  fs.writeFileSync(jsonPath, JSON.stringify(createdResults, null, 2));
  console.log(`\n3. Đã lưu báo cáo chi tiết vào: reports/florida_21_customers_created.json`);

  // Điều hướng sang trang Danh sách Khách hàng để chụp ảnh xác nhận
  console.log('4. Đang điều hướng sang giao diện Customer Directory...');
  await page.goto(`https://r2.gdesk.io/${BRANCH_ID}/customer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const screenshotPath = path.join(__dirname, '..', 'reports', 'florida_customers_directory_ui.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`5. Đã chụp ảnh giao diện Customer Directory: reports/florida_customers_directory_ui.png\n`);

  console.log('======================================================================');
  console.log(`   HOÀN TẤT TẠO TOÀN BỘ ${createdResults.length}/21 CUSTOMERS CHO FLORIDA!`);
  console.log('======================================================================');

  await browser.close();
})();
