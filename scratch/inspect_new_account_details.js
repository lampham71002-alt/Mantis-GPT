const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(5000);

  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  console.log('FULL_TOKEN:', token);

  const BASE_URL = 'https://apiv2.gdesk.io';

  // 1. Get Schedules
  const sRes = await fetch(`${BASE_URL}/api/schedules`, { headers: { token } });
  const sData = await sRes.json();
  console.log('Schedules:', sData.data?.schedules?.map(s => ({ id: s.id, name: s.name })));

  // 2. Check Custom Rules
  const rRes = await fetch(`${BASE_URL}/api/routing/mantis/custom-rules?limit=50`, { headers: { token } });
  const rData = await rRes.json();
  console.log('Existing Custom Rules count:', rData.data?.length || 0);

  // 3. Inspect Sandbox UI date and active view
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/mantis/sandbox');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'reports/new_acc_sandbox_ui.png' });

  const textSnippets = await page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('*').forEach(el => {
      const t = el.innerText || '';
      if (el.children.length === 0 && t.length > 5 && t.length < 120) {
        cards.push(t.trim());
      }
    });
    return Array.from(new Set(cards)).slice(0, 40);
  });
  console.log('Visible Sandbox Elements:', textSnippets);

  await browser.close();
})();
