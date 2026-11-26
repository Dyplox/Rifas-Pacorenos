import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAppData } from './resetApp';

describe('clearAppData', () => {
    let unregister;
    let cacheDelete;

    beforeEach(() => {
        localStorage.setItem('raffle_history', '[]');
        sessionStorage.setItem('__seeded', '1');
        unregister = vi.fn().mockResolvedValue(true);
        cacheDelete = vi.fn().mockResolvedValue(true);
        vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue(['workbox-precache', 'other']), delete: cacheDelete });
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { getRegistrations: vi.fn().mockResolvedValue([{ unregister }]) },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete navigator.serviceWorker;
    });

    const setOnline = (value) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);

    it('online: clears storage, the service worker and its caches, then reloads', async () => {
        setOnline(true);
        const reload = vi.fn();
        const result = await clearAppData({ reload });

        expect(localStorage.length).toBe(0);
        expect(sessionStorage.length).toBe(0);
        expect(unregister).toHaveBeenCalledOnce();
        expect(cacheDelete).toHaveBeenCalledTimes(2);
        expect(reload).toHaveBeenCalledOnce();
        expect(result).toEqual({ clearedOfflineCopy: true, clearedCaches: 2, unregisteredWorkers: 1 });
    });

    it('offline: clears storage but keeps the offline copy so the app can still load', async () => {
        setOnline(false);
        const reload = vi.fn();
        const result = await clearAppData({ reload });

        expect(localStorage.length).toBe(0);
        expect(unregister).not.toHaveBeenCalled();
        expect(cacheDelete).not.toHaveBeenCalled();
        expect(reload).toHaveBeenCalledOnce();
        expect(result.clearedOfflineCopy).toBe(false);
    });

    it('still reloads if clearing the cache fails', async () => {
        setOnline(true);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        navigator.serviceWorker.getRegistrations.mockRejectedValue(new Error('boom'));
        const reload = vi.fn();
        await clearAppData({ reload });
        expect(reload).toHaveBeenCalledOnce();
        expect(localStorage.length).toBe(0);
    });
});
