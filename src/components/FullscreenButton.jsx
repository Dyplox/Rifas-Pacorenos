import { memo, useCallback, useEffect, useState } from 'react';

const isFullscreenSupported = () =>
    typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);

const FullscreenButton = memo(() => {
    const [isFullscreen, setIsFullscreen] = useState(() =>
        typeof document !== 'undefined' && Boolean(document.fullscreenElement)
    );

    useEffect(() => {
        const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const request = document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen();
        request.catch((error) => console.warn('Fullscreen error:', error));
    }, []);

    // e.g. iPhone Safari has no Fullscreen API for documents
    if (!isFullscreenSupported()) return null;

    const label = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';

    return (
        <button
            type="button"
            onClick={toggleFullscreen}
            className="btn-settings"
            aria-label={label}
            title={label}
        >
            {isFullscreen ? '🗗' : '⛶'}
            <span className="btn-label">{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
        </button>
    );
});

FullscreenButton.displayName = 'FullscreenButton';

export default FullscreenButton;
