import { test, expect } from '@playwright/test';
import { seedSettings, raffleButton } from './helpers';

// Behavior does not depend on screen size: run once
test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'laptop', 'functional flow runs on one viewport');
});

test('keyboard raffle, history, undo delete, CSV and clear', async ({ page }) => {
    await seedSettings(page);
    await page.goto('./');

    // Space starts a raffle
    await page.keyboard.press('Space');
    await expect(page.getByRole('heading', { name: '¡Tenemos un Ganador!' })).toBeVisible();
    const items = page.locator('.history-item');
    await expect(items).toHaveCount(1);
    const number = await items.first().locator('.history-number').textContent();
    await expect(page.locator('.digit-container')).toHaveAttribute('aria-label', `Número ganador: ${number.split('').join(' ')}`);

    // Name a winner with the keyboard
    await page.getByRole('button', { name: `Agregar nombre al ganador del número ${number}` }).click();
    await page.keyboard.type('Ana');
    await page.keyboard.press('Enter');
    await expect(items.first()).toContainText('Ana');

    // Delete + undo
    await items.first().hover();
    await page.getByRole('button', { name: `Eliminar el número ${number} del historial` }).click();
    await expect(items).toHaveCount(0);
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Ana');

    // CSV export
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar historial en CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^rifa-historial-\d{4}-\d{2}-\d{2}\.csv$/);

    // Clear history through the confirm dialog
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await page.getByRole('button', { name: /Borrar Historial/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Borrar historial' });
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Borrar todo' }).click();
    await page.keyboard.press('Escape');
    await expect(items).toHaveCount(0);
});

test('settings dialog: Escape closes it and focus returns to the opener', async ({ page }) => {
    await seedSettings(page);
    await page.goto('./');
    const opener = page.getByRole('button', { name: 'Abrir configuración' });
    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Cantidad de Dígitos')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
});

test('manual mode reveals one digit per key press', async ({ page }) => {
    await seedSettings(page, { raffle_isManualRevealEnabled: 'true', raffle_digitCount: '2' });
    await page.goto('./');
    await page.keyboard.press('Enter');
    await expect(raffleButton(page)).toHaveText('Revelar Siguiente');
    await page.keyboard.press('Enter');
    await expect(raffleButton(page)).toHaveText('Rifar de Nuevo');
    await expect(page.locator('.history-item')).toHaveCount(1);
});

test('countdown builds suspense: grows, turns red, trembles, pauses, then "¡MATRACA!"', async ({ page }) => {
    await seedSettings(page, { raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '5' });
    await page.goto('./');
    await raffleButton(page).click();

    const popup = page.locator('.countdown-popup');
    const stage = page.locator('.countdown-stage');
    const looks = () => popup.evaluate(el => {
        const style = getComputedStyle(el);
        return { color: style.color, scale: parseFloat(style.scale) || 1 };
    });

    await expect(popup).toHaveText('5');
    await expect(stage).not.toHaveClass(/is-final/);
    const first = await looks();

    await expect(popup).toHaveText('3');
    await expect(stage).toHaveClass(/is-final/);
    await expect(stage).not.toHaveClass(/is-last/);

    await expect(popup).toHaveText('1');
    await expect(stage).toHaveClass(/is-last/);
    const last = await looks();
    expect(last.scale).toBeGreaterThan(first.scale);
    expect(last.color, 'color shifts from gold towards red').not.toBe(first.color);

    // Dramatic pause: no number, a light charging up
    await expect(page.locator('.countdown-charge')).toBeVisible();
    await expect(popup).toHaveCount(0);

    await expect(popup).toHaveText('¡MATRACA!', { timeout: 3000 });

    // Once "¡MATRACA!" closes, the number shows almost at once (short shuffle, 300ms)
    await expect(page.locator('.countdown-overlay')).toHaveCount(0, { timeout: 3000 });
    const closedAt = Date.now();
    await expect(page.locator('.digit-container.winner')).toBeVisible({ timeout: 3000 });
    expect(Date.now() - closedAt, 'ms from "¡MATRACA!" closing to the number').toBeLessThan(700);
    await expect(page.getByRole('heading', { name: '¡Tenemos un Ganador!' })).toBeVisible();
});
