const { chromium } = require('playwright');

(async () => {
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
  
  const res = await page.evaluate(async ({ tok }) => {
    const res = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
      method: 'PUT',
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0', platform: 'web', 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ schedule_ids: '249,261', start: '2026-10-12T00:00:00+00:00', end: '2026-10-17T23:59:59+00:00', statuses: -1, inc: 'recurring', color_id: 1, exclude: [] })
    });
    const text = await res.text();
    const chunks = text.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const beforeJobs = chunks.find(c => c.type === 'jobs' && c.scope === 'before')?.data || [];
    return beforeJobs.map(j => ({
      id: j.id,
      customer_id: j.customer?.id,
      customer_name: j.customer?.full_name,
      date_label: j.date_label,
      start: j.event?.start,
      end: j.event?.end,
      schedule_name: j.schedule?.name,
      schedule_id: j.schedule?.id,
      header: j.tile?.header,
      content: j.tile?.content
    }));
  }, { tok: token });

  console.log(`Total jobs found: ${res.length}`);
  const byDate = {};
  for (const j of res) {
    if (!byDate[j.date_label]) byDate[j.date_label] = [];
    byDate[j.date_label].push(j);
  }
  for (const [date, jobs] of Object.entries(byDate)) {
    console.log(`\n=== Date: ${date} (${jobs.length} jobs) ===`);
    jobs.forEach((j, i) => {
      console.log(`  [${i + 1}] ${j.customer_name} | Tech: ${j.schedule_name} | ${j.header} | Start: ${j.start}`);
    });
  }
  await browser.close();
})();
