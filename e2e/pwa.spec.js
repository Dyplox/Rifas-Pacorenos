import { test, expect } from '@playwright/test';
import { seedSettings, raffleButton } from './helpers';

test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'laptop', 'PWA behavior runs on one viewport');
});

test('manifest is valid and installable', async ({ page, request }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const response = await request.get(href);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({ name: 'Gran Rifa - Pacoreños en Medellín', display: 'standalone', lang: 'es' });
    expect(manifest.icons.map(i => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icon of manifest.icons) {
        expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
    }
});

test('works offline after the first visit', async ({ page, context }) => {
    await seedSettings(page);
    await page.goto('./');

    // Wait until the service worker controls the page (precache done)
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
            await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
        }
    });

    await context.setOffline(true);
    await page.reload();

    await expect(page.locator('.offline-badge')).toHaveText('Sin conexión');
    await raffleButton(page).click();
    await expect(page.getByRole('heading', { name: '¡Tenemos un Ganador!' })).toBeVisible();
    await expect(page.locator('.history-item')).toHaveCount(1);
});
