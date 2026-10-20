const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://r2.gdesk.io';
const API_URL = 'https://apiv2.gdesk.io';
const BRANCH = 'GD1LK8RC5OH0';

(async () => {
  console.log('======================================================================');
  console.log('   BẮT ĐẦU KHÁM PHÁ TOÀN DIỆN HỆ THỐNG R2 (R2.GDESK.IO)');
  console.log('   Tài khoản: lam.pham@gmail.com | Branch: ' + BRANCH);
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let token = '';

  page.on('request', r => {
    const h = r.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Đang đăng nhập vào R2...');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  console.log('Đăng nhập thành công! Token:', token.slice(0, 15) + '...\n');

  // Danh sách các route cốt lõi cần quét
  const ROUTES_TO_EXPLORE = [
    { name: 'Calendar', path: `/${BRANCH}/calendar` },
    { name: 'Customers Directory', path: `/${BRANCH}/customers` },
    { name: 'Invoices', path: `/${BRANCH}/invoices` },
    { name: 'Estimates', path: `/${BRANCH}/estimates` },
    { name: 'Jobs', path: `/${BRANCH}/jobs` },
    { name: 'Opportunities', path: `/${BRANCH}/opportunities` },
    { name: 'Map Dispatch', path: `/${BRANCH}/map` },
    { name: 'Materials', path: `/${BRANCH}/materials` },
    { name: 'Mantis Dashboard', path: `/${BRANCH}/mantis` },
    { name: 'Mantis Sandbox', path: `/${BRANCH}/mantis/sandbox` },
    { name: 'Mantis History', path: `/${BRANCH}/mantis/history` },
    { name: 'Mantis General Settings', path: `/${BRANCH}/mantis/settings` },
    { name: 'Mantis Custom Rules', path: `/${BRANCH}/mantis/settings/custom` },
    { name: 'Mantis Specific Rules', path: `/${BRANCH}/mantis/settings/specific` },
    { name: 'Settings Hub', path: `/${BRANCH}/settings` },
    { name: 'Settings Schedules', path: `/${BRANCH}/settings/schedules` },
    { name: 'Settings Services', path: `/${BRANCH}/settings/services` },
    { name: 'Settings Company', path: `/${BRANCH}/settings/company` },
    { name: 'Settings Users', path: `/${BRANCH}/settings/users` },
    { name: 'Settings Custom Fields', path: `/${BRANCH}/settings/custom-fields` },
    { name: 'Settings Tags', path: `/${BRANCH}/settings/tags` },
    { name: 'Settings Templates', path: `/${BRANCH}/settings/templates` }
  ];

  const explorationResults = [];

  for (let i = 0; i < ROUTES_TO_EXPLORE.length; i++) {
    const item = ROUTES_TO_EXPLORE[i];
    console.log(`[${i + 1}/${ROUTES_TO_EXPLORE.length}] Đang quét: ${item.name} (${item.path})...`);
    
    try {
      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const pageDetails = await page.evaluate(() => {
        // Thu thập tiêu đề, nút bấm chính, tabs, bộ lọc
        const title = document.title || '';
        const h1 = document.querySelector('h1')?.innerText?.trim() || '';
        const h2 = document.querySelector('h2')?.innerText?.trim() || '';
        const buttons = Array.from(document.querySelectorAll('button'))
          .map(b => b.innerText?.trim())
          .filter(t => t && t.length < 40 && !t.includes('\n'))
          .slice(0, 15);
        const tabs = Array.from(document.querySelectorAll('[role="tab"], .nav-tabs li, .ant-tabs-tab, ul[class*="tab"] li'))
          .map(t => t.innerText?.trim())
          .filter(Boolean);
        const inputs = Array.from(document.querySelectorAll('input[placeholder]'))
          .map(inp => inp.getAttribute('placeholder'))
          .filter(Boolean);
        const hasTable = Boolean(document.querySelector('table, .ant-table, [role="grid"]'));
        const bodyTextSample = document.body.innerText.replace(/\s+/g, ' ').slice(0, 300);

        return {
          title,
          h1,
          h2,
          buttons: [...new Set(buttons)],
          tabs: [...new Set(tabs)],
          inputPlaceholders: [...new Set(inputs)],
          hasTable,
          bodyTextSample
        };
      });

      console.log(`    -> Header: "${pageDetails.h1 || pageDetails.title}" | Buttons: ${pageDetails.buttons.slice(0, 4).join(', ')}`);
      explorationResults.push({
        name: item.name,
        path: item.path,
        url: `${BASE_URL}${item.path}`,
        accessible: true,
        ...pageDetails
      });
    } catch (err) {
      console.log(`    -> Lỗi / Không khả dụng: ${err.message}`);
      explorationResults.push({
        name: item.name,
        path: item.path,
        accessible: false,
        error: err.message
      });
    }
  }

  // Quét thêm danh mục API endpoints cốt lõi từ backend
  console.log('\n2. Quét danh mục cấu hình API của Branch...');
  const apiSummary = await page.evaluate(async ({ tok, bId, baseUrl }) => {
    const headers = { token: tok, 'gd-branch-id': bId, platform: 'web', 'Content-Type': 'application/json' };
    const [services, schedules, customRulesCount, mantisSettings, company] = await Promise.all([
      fetch(`${baseUrl}/api/services`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/schedules`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/routing/mantis/custom-rules/count`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/routing/mantis/settings`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${baseUrl}/api/company`, { headers }).then(r => r.json()).catch(() => null)
    ]);
    return {
      serviceCount: services?.data?.length || 0,
      services: (services?.data || []).map(s => s.name),
      schedules: (schedules?.data?.schedules || []).map(s => ({ id: s.id, name: s.name, schedule: s.schedule })),
      customRulesCount: customRulesCount?.data || 0,
      mantisSettings: mantisSettings?.data || null,
      company: company?.data?.name || null
    };
  }, { tok: token, bId: BRANCH, baseUrl: API_URL });

  console.log('API Summary:', JSON.stringify(apiSummary, null, 2));

  // Lưu file kết quả
  const resultData = {
    branch: BRANCH,
    exploredAt: new Date().toISOString(),
    apiSummary,
    routes: explorationResults
  };

  fs.writeFileSync('reports/r2_complete_exploration.json', JSON.stringify(resultData, null, 2));
  console.log('\nĐã lưu kết quả khảo sát đầy đủ vào: reports/r2_complete_exploration.json');

  await browser.close();
})();
