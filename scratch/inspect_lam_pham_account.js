const { chromium } = require('playwright');
const fs = require('fs');

async function inspectLamPham() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let token = '';

  page.on('request', req => {
    const h = req.headers();
    if (h['token']) token = h['token'];
  });

  console.log('1. Logging in with lam.pham@gmail.com / Ahihi123 ...');
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  const match = currentUrl.match(/https:\/\/r2\.gdesk\.io\/([^\/]+)/);
  const branchId = match ? match[1] : 'GD1LK8RC5OH0';
  console.log('Branch ID detected:', branchId);
  console.log('Token prefix:', token ? token.substring(0, 15) : 'NONE');

  // 1. Get Schedules via endpoint or calendar query
  const schedData = await page.evaluate(async ({ tok, bId }) => {
    try {
      const r = await fetch('https://apiv2.gdesk.io/api/schedules', {
        headers: { 'token': tok, 'gd-branch-id': bId }
      });
      return await r.json();
    } catch(e) { return { error: e.message }; }
  }, { tok: token, bId: branchId });
  console.log('\nSchedules data:', JSON.stringify(schedData).slice(0, 500));

  // 2. Get Specific Rules
  const specificRes = await page.evaluate(async ({ tok, bId }) => {
    try {
      const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/specific-rules?limit=20', {
        headers: { 'token': tok, 'gd-branch-id': bId }
      });
      return await r.json();
    } catch(e) { return { error: e.message }; }
  }, { tok: token, bId: branchId });

  console.log('\n--- SPECIFIC RULES (Total: ' + (specificRes.data ? (Array.isArray(specificRes.data) ? specificRes.data.length : Object.keys(specificRes.data).length) : 0) + ') ---');
  if (Array.isArray(specificRes.data)) {
    specificRes.data.forEach((rule, idx) => {
      console.log(`[${idx+1}] ID: ${rule.id} | Status: ${rule.status} | Item: ${JSON.stringify(rule.item)} | Desc: ${rule.description}`);
    });
  }

  // 3. Get History Feeds
  const historyRes = await page.evaluate(async ({ tok, bId }) => {
    try {
      const r = await fetch('https://apiv2.gdesk.io/api/routing/mantis/feeds/history?limit=10', {
        headers: { 'token': tok, 'gd-branch-id': bId }
      });
      return await r.json();
    } catch(e) { return { error: e.message }; }
  }, { tok: token, bId: branchId });

  console.log('\n--- HISTORY FEEDS ---');
  let latestHistoryId = null;
  if (Array.isArray(historyRes.data)) {
    historyRes.data.forEach((h, idx) => {
      console.log(`[${idx+1}] ID: ${h.id} | Mode: ${h.mode} | Jobs: ${h.jobs_count} | Date: ${h.created_at} | Status: ${h.status}`);
      if (idx === 0) latestHistoryId = h.id;
    });
  } else {
    console.log('History data raw:', JSON.stringify(historyRes).slice(0, 500));
  }

  // 4. Detail of latest History
  if (latestHistoryId) {
    const historyDetail = await page.evaluate(async ({ tok, bId, hId }) => {
      const r = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${hId}`, {
        headers: { 'token': tok, 'gd-branch-id': bId }
      });
      return await r.json();
    }, { tok: token, bId: branchId, hId: latestHistoryId });
    console.log(`\n--- LATEST HISTORY DETAIL (${latestHistoryId}) ---`);
    console.log('Period:', historyDetail.data?.period);
    console.log('Jobs count:', historyDetail.data?.jobs_count);
    console.log('Specific rules attached in history:', historyDetail.data?.specific_rules?.length);

    // Get logs of this history
    const historyLogs = await page.evaluate(async ({ tok, bId, hId }) => {
      const r = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${hId}/logs`, {
        headers: { 'token': tok, 'gd-branch-id': bId }
      });
      return await r.json();
    }, { tok: token, bId: branchId, hId: latestHistoryId });

    fs.writeFileSync('reports/lam_pham_latest_history_logs.json', JSON.stringify(historyLogs, null, 2));
    console.log('History logs items count:', historyLogs.data ? (Array.isArray(historyLogs.data) ? historyLogs.data.length : Object.keys(historyLogs.data).length) : 0);
  }

  // Save auth info
  fs.writeFileSync('reports/lam_pham_auth.json', JSON.stringify({ token, branchId }, null, 2));

  await browser.close();
}

inspectLamPham().catch(console.error);
