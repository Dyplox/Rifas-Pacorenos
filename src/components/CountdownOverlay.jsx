import { memo } from 'react';
import { useRaffle } from '../context/RaffleContext';

const CountdownOverlay = memo(() => {
    const { currentCount } = useRaffle();

    if (currentCount === null) return null;

    return (
        <div className="countdown-overlay">
            <div className="countdown-number">
                {currentCount}
            </div>
        </div>
    );
});

CountdownOverlay.displayName = 'CountdownOverlay';

export default CountdownOverlay;
