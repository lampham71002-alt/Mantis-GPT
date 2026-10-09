const { chromium } = require('playwright');
const fs = require('fs');

async function testSingleCustomer() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const result = await page.evaluate(async (tok) => {
    // 1. Init
    const initRes = await fetch('https://apiv2.gdesk.io/api/customers/init', {
      headers: { 'token': tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    }).then(r => r.json());
    const accNo = initRes.data?.number || '5020';

    // 2. Post customer
    const payload = {
      profile: {
        account_no: accNo,
        first_name: 'Auto Customer 01',
        last_name: 'Test',
        email: 'autocust01@test.com',
        phones: [{ type: 'mobile', number: '0901000001' }],
        source: '',
        tags: ['VIP'],
        status: '1'
      },
      additional_contacts: [],
      cards: [],
      service_location: {
        location_note: 'Test location note',
        billing_email: [],
        mdu: {},
        same_billing_location: true,
        billing_address: {
          bill_to: 'Auto Customer 01 Test',
          street1: '123 Le Loi',
          street2: '',
          city: 'Thanh pho Ho Chi Minh',
          state: 'Ho Chi Minh',
          zip: '54401',
          country: 'Vietnam',
          county: 'District 1',
          formattedAddress: '123 Le Loi, District 1, Ho Chi Minh 54401',
          lng: 106.6983,
          lat: 10.7769
        },
        service_address: {
          street1: '123 Le Loi',
          street2: '',
          city: 'Thanh pho Ho Chi Minh',
          state: 'Ho Chi Minh',
          zip: '54401',
          country: 'Vietnam',
          county: 'District 1',
          formattedAddress: '123 Le Loi, District 1, Ho Chi Minh 54401',
          lng: 106.6983,
          lat: 10.7769
        },
        location_name: '',
        address_to: 'Auto Customer 01 Test',
        messaging_preferences: {},
        wo_emails: []
      },
      fast_form: true
    };

    const createRes = await fetch('https://apiv2.gdesk.io/api/customers', {
      method: 'POST',
      headers: {
        'token': tok,
        'gd-branch-id': 'GD1LK8RC5OH0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    return { init: initRes, created: createRes };
  }, token);

  console.log('Test Create Customer Result:');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}
testSingleCustomer().catch(console.error);
