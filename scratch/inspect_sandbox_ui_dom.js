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
  await page.waitForTimeout(5000);

  console.log('Navigating to sandbox...');
  await page.goto('https://r2.gdesk.io/GDONWL5A5MI6/mantis/sandbox');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'reports/sandbox_actual_ui.png', fullPage: true });

  const uiData = await page.evaluate(() => {
    const allText = document.body.innerText;
    // Find all job tiles/cards
    const items = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.innerText && el.innerText.trim().length > 3) {
        // leaf text nodes
      }
    });
    return {
      title: document.title,
      url: window.location.href,
      bodyTextSnippet: allText.slice(0, 3000)
    };
  });

  console.log('UI Data Snippet:\n', uiData.bodyTextSnippet);

  await browser.close();
})();
