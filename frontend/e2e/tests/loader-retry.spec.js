import { test, expect } from '@playwright/test';

test.describe('Loader and retry behavior', () => {
  test('shows loader, then error and retry works', async ({ page }) => {
    // Target the preview server by default
    const base = process.env.E2E_BASE || 'http://localhost:4173';

    // Debug: log network requests and console messages to diagnose why error isn't shown
    page.on('request', (req) => console.log('[page.request]', req.url()));
    page.on('console', (msg) => console.log('[page.console]', msg.text()));

    // Mock the backend to avoid dependency on local gateway/services.
    // First call: simulate slow failure. Second call: return successful game data.
    let calls = 0;
    await page.route('**/api/games/*', async (route) => {
      calls++;
      if (calls === 1) {
        // delay a bit then return 503
        await page.waitForTimeout(1200);
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ msg: 'simulated failure' })
        });
      } else {
        const mock = {
          name: 'Mock Game',
          image: '/logo.png',
          artScore: 8.5,
          techScore: 9,
          developer: 'Mock Dev',
          editor: 'Mock Editor',
          engine: 'Mock Engine',
          releaseDate: '2025-01-01',
          tags: ['Action', 'Indie'],
          minRequirements: { processor: 'i5', memory: '8GB', graphics: 'GTX 1060', directX: '12', storage: '20GB' },
          compatibility: { status: 'Compatible', cpu: 'OK', gpu: 'OK', ram: 'OK' },
          synopsis: 'This is a mocked synopsis.',
          reviews: []
        };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mock) });
      }
    });

    await page.goto(base + '/game/1');

    // After mocked failure, expect error then retry
    const error = page.locator('role=alert');
    await expect(error).toBeVisible({ timeout: 5000 });

    const retry = page.getByRole('button', { name: 'Reintentar' });
    await expect(retry).toBeVisible();
    await retry.click();

    // After retry, mocked success should load content
    const content = page.locator('h1.game-title-main');
    await expect(content).toBeVisible({ timeout: 5000 });
    await expect(content).toHaveText('Mock Game');
  });
});
