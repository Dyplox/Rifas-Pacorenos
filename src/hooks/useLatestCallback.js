import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Returns a stable function that always calls the latest `callback`.
 * Use it for listeners registered in effects (keyboard shortcuts, timers)
 * that must see current state without re-subscribing.
 *
 * (React 19.2's useEffectEvent was tried here, but listeners registered in an
 * effect kept calling a stale closure — see App.test.jsx manual-mode test.)
 */
export const useLatestCallback = (callback) => {
    const ref = useRef(callback);
    useLayoutEffect(() => {
        ref.current = callback;
    });
    return useCallback((...args) => ref.current(...args), []);
};

export default useLatestCallback;
