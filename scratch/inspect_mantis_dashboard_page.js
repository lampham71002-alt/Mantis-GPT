const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function inspectMantisDashboard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  let token = '';
  const apiCalls = [];

  page.on('request', req => {
    const url = req.url();
    const h = req.headers();
    if (h['token']) token = h['token'];
    if (url.includes('mantis') || url.includes('routing')) {
      apiCalls.push({
        method: req.method(),
        url: url
      });
    }
  });

  console.log('1. Đang đăng nhập tài khoản lam.pham@gmail.com...');
  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const BRANCH = 'GD1LK8RC5OH0';
  console.log('2. Đang điều hướng đến Mantis AI Dashboard: https://r2.gdesk.io/' + BRANCH + '/mantis/dashboard ...');
  await page.goto(`https://r2.gdesk.io/${BRANCH}/mantis/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  // Chụp ảnh màn hình
  const screenshotPath = path.join(__dirname, '..', 'reports', 'mantis_dashboard_ui.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Đã lưu ảnh chụp Dashboard tại: ${screenshotPath}`);

  // Lấy toàn bộ text trên Dashboard
  const bodyText = await page.evaluate(() => document.body.innerText);

  // Lấy các element/card/thống kê chính
  const elementsInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, section')).filter(el => {
      const t = el.innerText || '';
      return t.includes('Run Time') || t.includes('Drive Time') || t.includes('Saved') || t.includes('Distance');
    }).map(el => el.innerText.slice(0, 200));

    return {
      title: document.title,
      url: window.location.href,
      cards: cards.slice(0, 10)
    };
  });

  const reportData = {
    url: elementsInfo.url,
    title: elementsInfo.title,
    apiCalls: apiCalls,
    bodyTextSnippet: bodyText.slice(0, 2000),
    cards: elementsInfo.cards
  };

  fs.writeFileSync('reports/mantis_dashboard_inspection.json', JSON.stringify(reportData, null, 2));
  console.log('Đã lưu dữ liệu bóc tách tại: reports/mantis_dashboard_inspection.json');

  console.log('\n--- TÓM TẮT API CALLS TRÊN MANTIS DASHBOARD ---');
  apiCalls.forEach(c => console.log(`${c.method} ${c.url}`));

  console.log('\n--- NỘI DUNG CHÍNH TRÊN MÀN HÌNH DASHBOARD ---');
  console.log(bodyText.slice(0, 800));

  await browser.close();
}

inspectMantisDashboard().catch(console.error);
