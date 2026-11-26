/**
 * Seeds localStorage before the app loads. Countdown is off by default to keep tests fast.
 */
export const seedSettings = async (page, settings = {}) => {
    const values = { raffle_isCountdownEnabled: 'false', ...settings };
    await page.addInitScript((entries) => {
        // Only seed on the first load, so reloads keep what the test changed
        if (sessionStorage.getItem('__seeded')) return;
        sessionStorage.setItem('__seeded', '1');
        for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    }, values);
};

export const raffleButton = (page) => page.locator('.btn-raffle');

/** Waits for finite CSS animations (entrance slides, pops) to finish before measuring. */
export const waitForAnimations = (page) => page.evaluate(() => Promise.all(
    document.getAnimations()
        .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
        .map(a => a.finished.catch(() => {}))
));
