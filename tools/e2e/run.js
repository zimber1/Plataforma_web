const puppeteer = require('puppeteer');

(async () => {
  const base = process.env.E2E_BASE || 'http://localhost:4173';
  const url = `${base}/games/1`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Opening', url);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for loader
    try {
      await page.waitForSelector('text/Cargando información del juego...', { timeout: 5000 });
      console.log('Loader visible');
    } catch (e) {
      console.log('Loader not detected (may have been fast)');
    }

    // Wait for either content or error
    const content = await page.$('h1.game-title-main');
    const error = await page.$('role=alert');

    if (error) {
      console.log('Error shown on page');
      // Try retry button
      const retry = await page.$x("//button[contains(., 'Reintentar')]");
      if (retry.length > 0) {
        console.log('Clicking retry');
        await retry[0].click();
        // wait a bit
        await page.waitForTimeout(2000);
        const contentAfter = await page.$('h1.game-title-main');
        console.log('Content after retry:', !!contentAfter);
      } else {
        console.log('No retry button found');
      }
    } else if (content) {
      const title = await page.evaluate(el => el.textContent, content);
      console.log('Content loaded:', title.trim());
    } else {
      console.log('Neither content nor error detected');
    }

    // take screenshot evidence
    await page.screenshot({ path: '../../docs/e2e-screenshot.png', fullPage: true });
    console.log('Screenshot saved to docs/e2e-screenshot.png');
  } catch (err) {
    console.error('E2E script error:', err.message);
  } finally {
    await browser.close();
  }
})();
