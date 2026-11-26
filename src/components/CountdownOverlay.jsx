import { memo, useEffect } from 'react';
import { useRaffle, GO_MESSAGE } from '../context/RaffleContext';
import { playGo, playTick } from '../utils/sound';

const CountdownOverlay = memo(() => {
    const { currentCount, countdownDuration, isSoundEnabled } = useRaffle();

    const isGo = currentCount === GO_MESSAGE;

    useEffect(() => {
        if (!isSoundEnabled || currentCount === null) return;
        if (currentCount === GO_MESSAGE) playGo();
        else playTick();
    }, [currentCount, isSoundEnabled]);

    if (currentCount === null) return null;

    // Total animation time (countdown numbers + the GO_MESSAGE moment)
    const totalAnimationTime = countdownDuration + 0.5;

    return (
        <div
            className="countdown-overlay"
            style={{
                animationDuration: `0.2s, ${totalAnimationTime}s`
            }}
        >
            <div
                key={currentCount}
                className={`countdown-popup ${isGo ? 'countdown-ya' : ''}`}
            >
                {currentCount}
            </div>
        </div>
    );
});

CountdownOverlay.displayName = 'CountdownOverlay';

export default CountdownOverlay;
