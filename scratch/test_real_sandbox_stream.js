const { chromium } = require('playwright');
const fs = require('fs');

async function testSandboxStream() {
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

  const res = await page.evaluate(async (tok) => {
    const url = 'https://apiv2.gdesk.io/api/routing/mantis/autopilot/jobs?agenda=agendaTwoWeeks&color_id=1&end=2026-10-17T23%3A59%3A59.999Z&inc=recurring&schedule_ids=249,261&start=2026-10-10T00%3A00%3A00.000Z';
    const r = await fetch(url, {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    const text = await r.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let events = [];
    for (const l of lines) {
      try {
        const p = JSON.parse(l);
        if (p.type === 'events' && Array.isArray(p.items)) events = p.items;
      } catch(e) {}
    }
    return { linesCount: lines.length, eventsCount: events.length, sample: events.slice(0, 3) };
  }, token);

  console.log('Real Sandbox stream result:', res);
  await browser.close();
}

testSandboxStream().catch(console.error);
