/**
 * Clears everything the app stores in this browser and reloads it.
 *
 * - Always: localStorage and sessionStorage (settings, history).
 * - Only when online: the service worker and its caches (offline copy of the app).
 *   Offline, deleting them would leave the app unable to load again, so they are kept.
 *
 * Returns what was cleared (used by tests); the page reloads afterwards.
 */
export const clearAppData = async ({ reload = () => window.location.reload() } = {}) => {
    localStorage.clear();
    sessionStorage.clear();

    const canClearOfflineCopy = navigator.onLine;
    let clearedCaches = 0;
    let unregisteredWorkers = 0;

    if (canClearOfflineCopy) {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                const results = await Promise.all(registrations.map(r => r.unregister()));
                unregisteredWorkers = results.filter(Boolean).length;
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                clearedCaches = keys.length;
            }
        } catch (error) {
            console.warn('Error clearing offline cache:', error);
        }
    }

    reload();
    return { clearedOfflineCopy: canClearOfflineCopy, clearedCaches, unregisteredWorkers };
};

export default clearAppData;
