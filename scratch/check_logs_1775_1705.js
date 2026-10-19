const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const branch = 'GD1LK8RC5OH0';

  const check = await page.evaluate(async ({ tok, bId }) => {
    const headers = {
      token: tok,
      'gd-branch-id': bId,
      platform: 'web',
      'Content-Type': 'application/json'
    };
    const out = {};
    for (const hid of ['1775', '1705', '1685', '1620']) {
      const r = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${hid}/logs`, { headers }).then(x => x.json());
      out[hid] = (r.data || []).map(l => ({
        jobId: l.item?.id,
        cust: l.customer?.full_name,
        fromStart: l.from?.start,
        toStart: l.to?.start,
        fromSch: l.from?.schedules?.[0]?.id,
        toSch: l.to?.schedules?.[0]?.id
      }));
    }

    // Also test manual/optimize across 2026-10-12 to 2026-10-16 (full range) with statuses: -1, exclude: []
    const optRes = await fetch('https://apiv2.gdesk.io/api/routing/mantis/manual/optimize', {
      method: 'PUT',
      headers: { ...headers, Accept: 'text/event-stream' },
      body: JSON.stringify({
        schedule_ids: '249',
        start: '2026-10-12T00:00:00+00:00',
        end: '2026-10-16T23:59:59+00:00',
        statuses: -1,
        inc: 'recurring',
        color_id: 1,
        exclude: []
      })
    });
    const text = await optRes.text();
    const chunks = text.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
    const daily = chunks.find(c => c.type === 'stats' && c.scope === 'daily');
    const total = chunks.find(c => c.type === 'stats' && c.scope === 'total');
    return { logs: out, daily: daily?.data, total: total?.data };
  }, { tok: token, bId: branch });

  console.log('Logs count per history:', Object.fromEntries(Object.entries(check.logs).map(([k, v]) => [k, v.length])));
  for (const [k, v] of Object.entries(check.logs)) {
    console.log(`--- History ${k} ---`);
    v.slice(0, 8).forEach(x => console.log(`  Job ${x.jobId} (${x.cust}): ${x.fromStart} (sch ${x.fromSch}) -> ${x.toStart} (sch ${x.toSch})`));
  }
  console.log('Optimize 12..16 Total stats:', JSON.stringify(check.total, null, 2));
  console.log('Optimize 12..16 Daily stats:', JSON.stringify(check.daily?.map(d => ({
    day: d.day_label,
    jobs: [d.jobs_assigned?.before?.value, d.jobs_assigned?.after?.value],
    drive: [d.drive_time?.before?.value, d.drive_time?.after?.value, d.drive_time?.saved?.value],
    dist: [d.distance?.before?.value, d.distance?.after?.value, d.distance?.saved?.value],
    saved: d.total_saved
  })), null, 2));

  await browser.close();
})();
