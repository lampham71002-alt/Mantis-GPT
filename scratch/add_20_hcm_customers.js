const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HCM_LOCATIONS = [
  { street: '65 Le Loi', ward: 'Ben Nghe', district: 'Quan 1', lat: 10.7735, lng: 106.7001 },
  { street: '135 Nam Ky Khoi Nghia', ward: 'Ben Thanh', district: 'Quan 1', lat: 10.7769, lng: 106.6953 },
  { street: '209 Hai Ba Trung', ward: 'Phuong 6', district: 'Quan 3', lat: 10.7876, lng: 106.6925 },
  { street: '180 Cach Mang Thang 8', ward: 'Phuong 10', district: 'Quan 3', lat: 10.7785, lng: 106.6802 },
  { street: '24 Vo Oanh', ward: 'Phuong 25', district: 'Binh Thanh', lat: 10.8033, lng: 106.7156 },
  { street: '152 Dien Bien Phu', ward: 'Phuong 25', district: 'Binh Thanh', lat: 10.7995, lng: 106.7170 },
  { street: '18 Phan Van Tri', ward: 'Phuong 7', district: 'Go Vap', lat: 10.8277, lng: 106.6874 },
  { street: '56 Nguyen Thai Son', ward: 'Phuong 3', district: 'Go Vap', lat: 10.8206, lng: 106.6838 },
  { street: '88 Phan Xich Long', ward: 'Phuong 2', district: 'Phu Nhuan', lat: 10.7963, lng: 106.6922 },
  { street: '108 Hoang Van Thu', ward: 'Phuong 9', district: 'Tan Binh', lat: 10.7997, lng: 106.6631 },
  { street: '25 Cong Hoa', ward: 'Phuong 4', district: 'Tan Binh', lat: 10.8012, lng: 106.6558 },
  { street: '256 Ba Thang Hai', ward: 'Phuong 12', district: 'Quan 10', lat: 10.7702, lng: 106.6698 },
  { street: '120 Nguyen Trai', ward: 'Phuong 3', district: 'Quan 5', lat: 10.7589, lng: 106.6715 },
  { street: '88 An Duong Vuong', ward: 'Phuong 9', district: 'Quan 5', lat: 10.7562, lng: 106.6750 },
  { street: '101 Nguyen Thi Thap', ward: 'Tan Phu', district: 'Quan 7', lat: 10.7381, lng: 106.7099 },
  { street: '50 Nguyen Van Linh', ward: 'Tan Thuan Tay', district: 'Quan 7', lat: 10.7420, lng: 106.7210 },
  { street: '68 Thao Dien', ward: 'Thao Dien', district: 'Thu Duc', lat: 10.8055, lng: 106.7329 },
  { street: '10 Vo Van Ngan', ward: 'Linh Chieu', district: 'Thu Duc', lat: 10.8512, lng: 106.7718 },
  { street: '45 Doan Van Bo', ward: 'Phuong 12', district: 'Quan 4', lat: 10.7600, lng: 106.7020 },
  { street: '86 Lac Long Quan', ward: 'Phuong 3', district: 'Quan 11', lat: 10.7680, lng: 106.6510 }
];

async function add20HcmCustomers() {
  console.log('======================================================================');
  console.log('   TIẾN TRÌNH TẠO 20 CUSTOMERS TẠI TP. HỒ CHÍ MINH, VIỆT NAM');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: GD1LK8RC5OH0');
  console.log('   Không gắn tag (tags: []) - Tọa độ Geocoded thực tế từng quận');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const BRANCH = 'GD1LK8RC5OH0';
  const createdCustomers = [];

  for (let i = 0; i < HCM_LOCATIONS.length; i++) {
    const loc = HCM_LOCATIONS[i];
    const indexStr = String(i + 1).padStart(2, '0');
    const customerName = `HCM Customer ${indexStr}`;

    console.log(`\n[${i+1}/20] Đang tạo khách hàng: ${customerName} (${loc.street}, ${loc.district})...`);

    const result = await page.evaluate(async ({ tok, bId, cName, locInfo }) => {
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
          email: `hcm.customer${cName.replace(/\D/g, '')}@example.com`,
          phones: [{ type: 'mobile', number: `0908${String(cName.replace(/\D/g, '')).padStart(6, '0')}` }],
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
    }, { tok: token, bId: BRANCH, cName: customerName, locInfo: loc });

    if (result.success && result.customerId) {
      console.log(` -> ✅ THÀNH CÔNG: Customer ID: ${result.customerId} | Acc No: ${result.accNo}`);
      console.log(`    Địa chỉ: ${result.location?.address} (Lat: ${result.location?.lat}, Lng: ${result.location?.lng})`);
      createdCustomers.push({
        index: i + 1,
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

    // Short pause between API calls
    await page.waitForTimeout(500);
  }

  // Save report
  fs.writeFileSync('reports/hcm_20_customers_created.json', JSON.stringify(createdCustomers, null, 2));

  // Navigate to UI Customers page to take screenshot
  console.log('\n2. Chụp ảnh màn hình danh bạ Customers trên UI...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/customers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'reports/hcm_20_customers_ui.png' });

  console.log('\n======================================================================');
  console.log(`   HOÀN TẤT TẠO ${createdCustomers.length}/20 CUSTOMERS TẠI TP. HỒ CHÍ MINH!`);
  console.log('======================================================================');

  await browser.close();
}

add20HcmCustomers().catch(console.error);
