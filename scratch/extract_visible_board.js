const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('https://r2.gdesk.io/auth/login');
  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  await inputs[0].fill('lamlam@gmail.com');
  await inputs[1].fill('Ahihi123456@');
  await inputs[1].press('Enter');
  await page.waitForTimeout(4000);
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(8000);

  const visibleJobs = await page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.innerText || '';
      if (text.includes('FL Routing Test') || text.includes('NaplesAuto') || text.includes('Sterling') || text.includes('TestAuto')) {
        if (el.children.length <= 4 && text.length > 5 && text.length < 150) {
          cards.push(text.trim().replace(/\n+/g, ' | '));
        }
      }
    });
    return Array.from(new Set(cards));
  });

  console.log('Total visible cards on screen:', visibleJobs.length);
  visibleJobs.forEach((c, i) => console.log((i + 1) + '. ' + c));
  await browser.close();
})();
