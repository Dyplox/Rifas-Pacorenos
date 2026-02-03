import { useEffect, useState, useMemo, memo } from 'react';
import { useRaffle } from '../context/RaffleContext';

const RaffleDisplay = memo(() => {
    const { digitCount, isRaffling, winner, revealedCount } = useRaffle();
    const [shuffleDigits, setShuffleDigits] = useState('');

    // Handle shuffling animation
    useEffect(() => {
        if (!isRaffling) return;

        const interval = setInterval(() => {
            let randomStr = '';
            for (let i = 0; i < digitCount; i++) {
                randomStr += Math.floor(Math.random() * 10).toString();
            }
            setShuffleDigits(randomStr);
        }, 60);

        return () => clearInterval(interval);
    }, [isRaffling, digitCount]);

    const isWinnerRevealed = winner && !isRaffling && revealedCount === digitCount;

    const containerClassName = useMemo(() =>
        `digit-container ${isWinnerRevealed ? 'winner' : ''}`,
        [isWinnerRevealed]
    );

    // Memoize digit boxes to prevent unnecessary recalculations
    const digitBoxes = useMemo(() =>
        Array.from({ length: digitCount }).map((_, idx) => {
            let content;

            // If winner is present and this digit is revealed, show it
            if (winner && idx < revealedCount) {
                content = winner[idx];
            }
            // If currently raffling (and not revealed yet), show random shuffle digit
            else if (isRaffling) {
                content = shuffleDigits[idx] || '*';
            }
            // Otherwise (before raffle or unrevealed), show mask
            else {
                content = '*';
            }

            return (
                <div
                    key={idx}
                    className="digit-box"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                >
                    {content}
                </div>
            );
        }),
        [digitCount, winner, revealedCount, isRaffling, shuffleDigits]
    );

    return (
        <div className={containerClassName}>
            {digitBoxes}
        </div>
    );
});

RaffleDisplay.displayName = 'RaffleDisplay';

export default RaffleDisplay;
