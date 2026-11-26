import { test } from '@playwright/test';
import { seedSettings, raffleButton } from './helpers';

// Visual review aid, not an assertion: SCREENSHOTS=1 pnpm test:e2e screenshots
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture review screenshots');

const history = JSON.stringify(Array.from({ length: 6 }, (_, i) => ({
    id: `id-${i}`, number: String(100 + i * 37).padStart(3, '0'), winnerName: i % 2 ? '' : `Ganador ${i + 1}`,
    timestamp: '10:0' + i + ':00', createdAt: '2026-11-26T15:00:00Z',
})));

test('capture key screens', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const dir = `e2e-screens/${testInfo.project.name}`;
    await seedSettings(page, { raffle_history: history, raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '5' });
    await page.goto('./');
    await page.screenshot({ path: `${dir}/1-idle.png`, fullPage: true });

    await raffleButton(page).click();
    // Best effort: slow mobile screenshots can miss a 1s phase (layout/raffle specs assert them)
    const capture = async (locator, name, delay) => {
        if (await locator.waitFor({ timeout: 4000 }).then(() => true, () => false)) {
            await page.waitForTimeout(delay);
            await page.screenshot({ path: `${dir}/${name}.png` });
        }
    };
    for (const n of ['5', '3', '1']) {
        await capture(page.locator('.countdown-popup', { hasText: new RegExp(`^${n}$`) }), `2-countdown-${n}`, 400);
    }
    await capture(page.locator('.countdown-charge'), '2-countdown-pause', 350);
    // "¡MATRACA!" lasts 800ms; a slow mobile screenshot above can miss it (layout.spec checks it fits)
    const matraca = page.locator('.countdown-popup', { hasText: '¡MATRACA!' });
    if (await matraca.waitFor({ timeout: 4000 }).then(() => true, () => false)) {
        await page.screenshot({ path: `${dir}/3-matraca.png` });
    }

    await page.getByRole('heading', { name: '¡Tenemos un Ganador!' }).waitFor();
    await page.waitForTimeout(5500); // let the confetti finish
    await page.screenshot({ path: `${dir}/4-winner.png`, fullPage: true });

    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/5-settings.png` });
});
