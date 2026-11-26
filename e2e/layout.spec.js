import { test, expect } from '@playwright/test';
import { seedSettings, raffleButton, waitForAnimations } from './helpers';

const MIN_TOUCH = 44;

const viewportOf = (page) => page.viewportSize();

const expectInsideViewport = async (page, locator) => {
    const box = await locator.boundingBox();
    const { width, height } = viewportOf(page);
    expect(box, 'element should be rendered').not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
};

test.describe('responsive layout', () => {
    for (const digits of [1, 3, 5]) {
        test(`${digits} digits: no horizontal scroll, digits as large as possible, button above the fold`, async ({ page }) => {
            await seedSettings(page, { raffle_digitCount: String(digits) });
            await page.goto('./');

            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow).toBeLessThanOrEqual(0);

            const boxes = page.locator('.digit-box');
            await expect(boxes).toHaveCount(digits);

            // Digits either fill the card width or reach the height cap
            const sizes = await page.evaluate(() => {
                const card = document.querySelector('.card-raffle');
                const style = getComputedStyle(card);
                const inner = card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
                const row = document.querySelector('.digit-container').getBoundingClientRect();
                const first = document.querySelector('.digit-box').getBoundingClientRect();
                const children = [...document.querySelectorAll('.digit-box')].map(b => b.getBoundingClientRect());
                const rowWidth = children.at(-1).right - children[0].left;
                return { inner, rowWidth, boxHeight: first.height, vh: window.innerHeight, rowLeft: row.left };
            });
            // Same height cap as .digit-box in index.css (keeps the winner message on screen)
            const vh = sizes.vh;
            const heightCap = Math.min(0.30 * vh, Math.max(0.16 * vh, (vh - (150 + 0.5 * vh)) / 1.35)) * 1.35;
            const fillsWidth = sizes.rowWidth >= sizes.inner * 0.95;
            const fillsHeight = sizes.boxHeight >= heightCap * 0.95;
            expect(fillsWidth || fillsHeight, JSON.stringify(sizes)).toBe(true);

            for (let i = 0; i < digits; i++) await expectInsideViewport(page, boxes.nth(i));
            await expectInsideViewport(page, raffleButton(page));
        });
    }

    test('after a draw, digits and the winner message are visible without scrolling', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'phone-landscape', 'a 360px-tall screen cannot show both; it scrolls');
        await seedSettings(page);
        await page.goto('./');
        await raffleButton(page).click();
        const message = page.locator('.winner-result-box');
        await expect(message).toBeVisible();
        await waitForAnimations(page);
        await expectInsideViewport(page, message);
        await expectInsideViewport(page, page.locator('.digit-box').first());
    });

    test('touch targets are at least 44px', async ({ page }) => {
        await seedSettings(page, { raffle_history: JSON.stringify([{ id: 'a', number: '123', winnerName: '', timestamp: '10:00:00', createdAt: '2026-11-26T10:00:00Z' }]) });
        await page.goto('./');
        const selectors = ['.btn-raffle', '.btn-settings', '.history-delete', '.winner-name-display'];
        for (const selector of selectors) {
            const box = await page.locator(selector).first().boundingBox();
            expect(box.height, selector).toBeGreaterThanOrEqual(selector === '.winner-name-display' ? 36 : MIN_TOUCH);
            expect(box.width, selector).toBeGreaterThanOrEqual(MIN_TOUCH);
        }
    });

    test('countdown numbers and "¡MATRACA!" fit on screen', async ({ page }) => {
        await seedSettings(page, { raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '3' });
        await page.goto('./');
        await raffleButton(page).click();

        const popup = page.locator('.countdown-popup');
        // Layout box (ignores the pop/float transforms) relative to the full-screen overlay
        const layoutBox = () => popup.evaluate(el => ({
            left: el.offsetLeft, top: el.offsetTop,
            right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight,
        }));
        const { width, height } = page.viewportSize();
        const expectFits = (box) => {
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.top).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(width);
            expect(box.bottom).toBeLessThanOrEqual(height);
        };

        await expect(popup).toHaveText('3');
        expectFits(await layoutBox());
        // Numbers should dominate the screen
        const numberBox = await layoutBox();
        expect(numberBox.bottom - numberBox.top).toBeGreaterThanOrEqual(Math.min(width, height) * 0.5);

        await expect(popup).toHaveText('¡MATRACA!', { timeout: 5000 });
        expectFits(await layoutBox());
    });

    test('settings dialog fits on screen and every control is reachable', async ({ page }) => {
        await seedSettings(page);
        await page.goto('./');
        await page.getByRole('button', { name: 'Abrir configuración' }).click();

        const dialog = page.getByRole('dialog', { name: 'Configuración' });
        await expect(dialog).toBeVisible();
        await waitForAnimations(page);
        await expectInsideViewport(page, dialog);

        const save = dialog.getByRole('button', { name: 'Guardar' });
        await save.scrollIntoViewIfNeeded();
        await expect(save).toBeInViewport();
    });
});
