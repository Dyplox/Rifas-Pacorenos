import { memo, useEffect } from 'react';
import { useRaffle, GO_MESSAGE, SUSPENSE, SUSPENSE_MS } from '../context/RaffleContext';
import { playGo, playHeartbeat, startDrumRoll } from '../utils/sound';
import { countdownTension } from '../utils/countdown';

const CountdownOverlay = memo(() => {
    const { currentCount, countdownDuration, isSoundEnabled } = useRaffle();

    const isGo = currentCount === GO_MESSAGE;
    const isSuspense = currentCount === SUSPENSE;
    const isNumber = typeof currentCount === 'number';
    const tension = countdownTension(currentCount, countdownDuration);

    useEffect(() => {
        if (!isSoundEnabled || currentCount === null) return;
        if (currentCount === GO_MESSAGE) playGo();
        // The roll keeps going until the number is revealed (stopped in App.jsx)
        else if (currentCount === SUSPENSE) startDrumRoll();
        else playHeartbeat(countdownTension(currentCount, countdownDuration));
    }, [currentCount, countdownDuration, isSoundEnabled]);

    if (currentCount === null) return null;

    // Total animation time: numbers + dramatic pause + the GO_MESSAGE moment
    const totalAnimationTime = countdownDuration + SUSPENSE_MS / 1000 + 0.5;

    const stageClasses = [
        'countdown-stage',
        isNumber && currentCount <= 3 ? 'is-final' : '',
        isNumber && currentCount === 1 ? 'is-last' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={`countdown-overlay ${isSuspense ? 'is-suspense' : ''}`}
            role="timer"
            aria-live="assertive"
            style={{
                animationDuration: `0.2s, ${totalAnimationTime}s`,
                '--tension': tension,
            }}
        >
            <div className={stageClasses}>
                {isSuspense ? (
                    <>
                        <div className="countdown-charge" aria-hidden="true" />
                        <span className="visually-hidden">Atentos…</span>
                    </>
                ) : (
                    <div
                        key={currentCount}
                        className={`countdown-popup ${isGo ? 'countdown-ya' : ''}`}
                    >
                        {currentCount}
                    </div>
                )}
            </div>
        </div>
    );
});

CountdownOverlay.displayName = 'CountdownOverlay';

export default CountdownOverlay;
