const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let token = null;
  let companyId = null;
  let branch = null;

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('/api/auth/login') || u.includes('/api/login') || u.includes('/api/v2/auth/login')) {
      try {
        const text = await res.text();
        console.log('Login Response:', text);
      } catch(e){}
    }
    if (u.includes('/api/')) {
      const headers = res.request().headers();
      if (headers['token']) token = headers['token'];
    }
  });

  console.log('Logging into new account lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const url = page.url();
  console.log('Logged in URL:', url);
  // Extract branch from URL: https://r2.gdesk.io/<BRANCH>/...
  const match = url.match(/https:\/\/r2\.gdesk\.io\/([^\/]+)/);
  if (match) branch = match[1];

  // Extract token from localStorage or cookies
  const storage = await page.evaluate(() => {
    return {
      localStorage: { ...localStorage },
      cookies: document.cookie
    };
  });

  console.log('Branch:', branch);
  console.log('LocalStorage keys:', Object.keys(storage.localStorage));
  if (storage.localStorage['token']) token = storage.localStorage['token'];
  if (storage.localStorage['auth_token']) token = storage.localStorage['auth_token'];
  console.log('Extracted Token:', token ? token.slice(0, 30) + '...' : 'none');

  await browser.close();
})();
