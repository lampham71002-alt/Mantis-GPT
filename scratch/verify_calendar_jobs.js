const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 1000 });

  let token = '';
  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  // 1. Query API for jobs from 2026-10-11 to 2026-10-14
  const apiRes = await page.evaluate(async (tok) => {
    const url = 'https://apiv2.gdesk.io/api/jobs?schedule=249&start=2026-10-11T00:00:00.000Z&end=2026-10-14T23:59:59.000Z';
    const res = await fetch(url, {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await res.json();
  }, token);

  const jobsList = apiRes.data || [];
  console.log(`Tìm thấy tổng cộng ${jobsList.length} jobs trên Calendar trong khoảng 11/10 - 14/10/2026.`);

  const byDate = {};
  jobsList.forEach(j => {
    const d = j.date ? j.date.substring(0, 10) : 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push({
      id: j.id,
      customer_name: j.customer?.name || j.customer_name,
      customer_id: j.customer_id,
      service: j.service?.name
    });
  });

  console.log('Chi tiết theo từng ngày:');
  for (const [d, list] of Object.entries(byDate)) {
    console.log(` Ngày ${d}: ${list.length} jobs`);
    list.forEach(item => {
      console.log(`   - Job #${item.id} | Customer: ${item.customer_name} (ID: ${item.customer_id})`);
    });
  }

  // 2. Chụp ảnh Calendar chi tiết
  // Thử mở calendar với date parameter hoặc điều hướng
  await page.goto('https://r2.gdesk.io/GD1LK8RC5OH0/calendar?schedules=249&date=2026-10-11&view=agendaWeek', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);

  const screenshotPath = path.join(__dirname, '..', 'reports', 'hcm_20_jobs_calendar_detail.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Đã chụp ảnh màn hình Calendar chi tiết tại: ${screenshotPath}`);

  await browser.close();
})();
