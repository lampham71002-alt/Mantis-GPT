const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log('1. Launching Chromium Browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  const token = 'n96YY9xy1pm9AqOLGRUc4vbs7D0Gp9rPocm1ujoOWMRoTVYvGrzW4wngp4A1mvAACz26PndJ7K4MLEQ1s9DGkgSIBO9ppJevUU8ekVbjWAC1f8UoGQOUZwItLIiMMBxR843614451791025826';
  const branchId = 'GDONWL5A5MI6';

  console.log('2. Setting authentication token & local storage...');
  await page.addInitScript(({ t, b }) => {
    window.localStorage.setItem('token', t);
    window.localStorage.setItem('gd-branch-id', b);
    window.localStorage.setItem('platform', 'web');
  }, { t: token, b: branchId });

  console.log('3. Navigating to GDesk Web Portal Calendar UI...');
  try {
    await page.goto(`https://r2.gdesk.io/${branchId}/`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    console.log('Navigation warning:', err.message);
  }

  await page.waitForTimeout(5000);

  const screenshotPathBefore = path.join(__dirname, 'calendar_ui_before.png');
  await page.screenshot({ path: screenshotPathBefore, fullPage: true });
  console.log('Captured screenshot before drag:', screenshotPathBefore);

  // Search for Job tiles on calendar
  const events = await page.$$('.fc-event, div[class*="event"], div[class*="job"]');
  console.log(`Discovered ${events.length} event tiles on the calendar UI.`);

  // Attempt Drag & Drop from Oct 4th to Oct 11th if elements found
  if (events.length > 0) {
    console.log('Performing Drag & Drop mouse gesture on Job tile...');
    const firstJob = events[0];
    const boundingBox = await firstJob.boundingBox();

    if (boundingBox) {
      console.log(`Job Tile Position: x=${boundingBox.x}, y=${boundingBox.y}`);
      // Perform drag action 500px to the right across columns
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + 500, boundingBox.y + 100, { steps: 25 });
      await page.mouse.up();
      console.log('Drag and Drop mouse action performed.');
    }
  }

  await page.waitForTimeout(4000);

  const screenshotPathAfter = path.join(__dirname, 'calendar_ui_after.png');
  await page.screenshot({ path: screenshotPathAfter, fullPage: true });
  console.log('Captured screenshot after drag:', screenshotPathAfter);

  await browser.close();
  console.log('UI Automation completed successfully.');
})();
