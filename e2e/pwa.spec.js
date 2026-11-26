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

test('"Borrar caché y datos" resets settings, history and the offline cache, then reloads', async ({ page }) => {
    // Seed once by hand: seedSettings() would re-seed after the reload, since its guard
    // lives in sessionStorage, which this button clears.
    await page.goto('./');
    await page.evaluate(() => {
        localStorage.setItem('raffle_isCountdownEnabled', 'false');
        localStorage.setItem('raffle_digitCount', '5');
        localStorage.setItem('raffle_history', JSON.stringify([{ id: 'a', number: '12345', winnerName: 'Ana', timestamp: '10:00:00' }]));
    });
    await page.reload();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('.digit-box')).toHaveCount(5);
    await expect(page.locator('.history-item')).toHaveCount(1);

    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await page.getByRole('button', { name: /Borrar Caché y Datos/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Borrar caché y datos' });
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    const reloaded = page.waitForEvent('load');
    await confirm.getByRole('button', { name: 'Borrar y recargar' }).click();
    await reloaded;

    // Back to defaults: 3 digits, empty history
    await expect(page.locator('.digit-box')).toHaveCount(3);
    await expect(page.locator('.history-empty')).toBeVisible();
    // Countdown is back to its default (on); the app keeps working
    await raffleButton(page).click();
    await expect(page.locator('.history-item')).toHaveCount(1, { timeout: 10_000 });
    expect(await page.evaluate(() => localStorage.getItem('raffle_digitCount'))).toBe('3');
});
