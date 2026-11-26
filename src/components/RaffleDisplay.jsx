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
                content = <span className="digit-mask">*</span>;
            }

            return (
                <div
                    key={idx}
                    className="digit-box"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    aria-hidden="true"
                >
                    {content}
                </div>
            );
        }),
        [digitCount, winner, revealedCount, isRaffling, shuffleDigits]
    );

    // What screen readers hear instead of the individual boxes
    const accessibleLabel = useMemo(() => {
        if (isRaffling) return 'Sorteando…';
        if (!winner || revealedCount === 0) return `Número oculto de ${digitCount} dígitos`;
        const revealed = winner.slice(0, revealedCount).split('').join(' ');
        if (revealedCount === digitCount) return `Número ganador: ${revealed}`;
        return `Dígitos revelados: ${revealed}. Faltan ${digitCount - revealedCount}`;
    }, [isRaffling, winner, revealedCount, digitCount]);

    return (
        <div
            className={containerClassName}
            style={{ '--digits': digitCount }}
            role="img"
            aria-label={accessibleLabel}
        >
            {digitBoxes}
        </div>
    );
});

RaffleDisplay.displayName = 'RaffleDisplay';

export default RaffleDisplay;
