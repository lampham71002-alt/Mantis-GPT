const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', req => { if (req.headers()['token']) token = req.headers()['token']; });
  await page.goto('https://r2.gdesk.io/auth/login');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(4000);

  const url = 'https://apiv2.gdesk.io/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=31,32,89&start=2026-10-04T00%3A00%3A00.000Z';
  const res = await fetch(url, { headers: { token } });
  const rawText = await res.text();
  const lines = rawText.split('\n').filter(l => l.trim());
  let events = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'events' && Array.isArray(parsed.items)) events = parsed.items;
    } catch(e) {}
  }

  console.log('--- ALL 24 SANDBOX BASELINE JOBS ---');
  const summary = events.map((e, idx) => {
    const cust = (e.customer?.name || e.customer?.full_name || '').trim();
    const serv = (e.job_tiles?.find(t=>t.field==='service_type')?.value || '').trim();
    return {
      idx: idx + 1,
      date: e.date_label,
      tech: e.schedule?.name,
      customer: cust,
      service: serv,
      start: e.event?.start,
      header: e.tile?.header
    };
  });

  console.table(summary);
  fs.writeFileSync('reports/baseline_24_stream_jobs.json', JSON.stringify(summary, null, 2));

  await browser.close();
})();
