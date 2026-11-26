import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { pickWinner, generateId } from '../utils/random';

const RaffleContext = createContext();

export const MIN_DIGITS = 1;
export const MAX_DIGITS = 5;
export const MIN_COUNTDOWN = 3;
export const MAX_COUNTDOWN = 10;

// Animation timings (ms)
export const TRADITIONAL_SHUFFLE_MS = 800;
export const DIGIT_STEP_MS = 500;
export const GO_MESSAGE_MS = 800;
export const GO_MESSAGE = '¡MATRACA!';
// Dramatic pause between the last number and GO_MESSAGE (screen goes dark, a light "charges up")
export const SUSPENSE_MS = 1200;
export const SUSPENSE = 'suspense';

const isIntegerInRange = (min, max) => (value) =>
  Number.isInteger(value) && value >= min && value <= max;

const isValidHistory = (value) =>
  Array.isArray(value) && value.every(entry => entry && typeof entry.number === 'string');

// eslint-disable-next-line react-refresh/only-export-components
export const useRaffle = () => {
  const context = useContext(RaffleContext);
  if (!context) {
    throw new Error('useRaffle must be used within a RaffleProvider');
  }
  return context;
};

// Helper to create a history entry
const createHistoryEntry = (number) => {
  const now = new Date();
  return {
    id: generateId(),
    number,
    winnerName: '', // Optional: name of the winner
    createdAt: now.toISOString(),
    timestamp: now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  };
};

export const RaffleProvider = ({ children }) => {
  // Persisted state via custom hook
  const [digitCount, setDigitCount] = useLocalStorage('raffle_digitCount', 3, {
    validate: isIntegerInRange(MIN_DIGITS, MAX_DIGITS)
  });
  const [isManualRevealEnabled, setIsManualRevealEnabled] = useLocalStorage('raffle_isManualRevealEnabled', false);
  const [isCountdownEnabled, setIsCountdownEnabled] = useLocalStorage('raffle_isCountdownEnabled', true);
  const [countdownDuration, setCountdownDuration] = useLocalStorage('raffle_countdownDuration', 3, {
    validate: isIntegerInRange(MIN_COUNTDOWN, MAX_COUNTDOWN)
  });
  const [isNoRepeatEnabled, setIsNoRepeatEnabled] = useLocalStorage('raffle_isNoRepeatEnabled', true);
  const [isSoundEnabled, setIsSoundEnabled] = useLocalStorage('raffle_isSoundEnabled', false);
  const [history, setHistory] = useLocalStorage('raffle_history', [], { validate: isValidHistory });

  // Transient state (not persisted)
  const [isRaffling, setIsRaffling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentCount, setCurrentCount] = useState(null);

  // Pending timers, so a reset can cancel an in-flight raffle
  const countdownIntervalRef = useRef(null);
  const timeoutsRef = useRef(new Set());

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      fn();
    }, ms);
    timeoutsRef.current.add(id);
  }, []);

  const cancelPendingTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => cancelPendingTimers, [cancelPendingTimers]);

  // Numbers already drawn with the current digit count
  const drawnNumbers = useMemo(() => new Set(
    history.map(entry => entry.number).filter(number => number.length === digitCount)
  ), [history, digitCount]);

  const totalNumbers = 10 ** digitCount;
  const availableCount = isNoRepeatEnabled ? totalNumbers - drawnNumbers.size : totalNumbers;

  /**
   * Generates a random number with the length based on digitCount.
   * Returns null if no-repeat is enabled and every number was already drawn.
   */
  const generateWinner = useCallback(() => (
    pickWinner(digitCount, isNoRepeatEnabled ? drawnNumbers : undefined)
  ), [digitCount, isNoRepeatEnabled, drawnNumbers]);

  /**
   * Adds winner to history
   */
  const addToHistory = useCallback((number) => {
    setHistory(prev => [createHistoryEntry(number), ...prev]);
  }, [setHistory]);

  /**
   * Executes the actual raffle after any countdown
   */
  const executeRaffle = useCallback(() => {
    setIsRaffling(true);
    setWinner(null);
    setRevealedCount(0);

    schedule(() => {
      const newWinner = generateWinner();
      setIsRaffling(false);
      if (newWinner === null) return;
      setWinner(newWinner);
      setRevealedCount(digitCount);
      addToHistory(newWinner);
    }, TRADITIONAL_SHUFFLE_MS);
  }, [digitCount, generateWinner, addToHistory, schedule]);

  /**
   * Helper to run a callback with or without countdown
   */
  const runWithCountdown = useCallback((callback) => {
    cancelPendingTimers();

    if (isCountdownEnabled) {
      let count = countdownDuration;
      setCurrentCount(count);

      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCurrentCount(count);
        } else {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setCurrentCount(SUSPENSE);
          schedule(() => {
            setCurrentCount(GO_MESSAGE);
            schedule(() => {
              setCurrentCount(null);
              callback();
            }, GO_MESSAGE_MS);
          }, SUSPENSE_MS);
        }
      }, 1000);
    } else {
      callback();
    }
  }, [isCountdownEnabled, countdownDuration, cancelPendingTimers, schedule]);

  /**
   * Traditional raffle: everything is revealed after a short delay
   */
  const runTraditionalRaffle = useCallback(() => {
    if (isRaffling || currentCount !== null || availableCount === 0) return;
    runWithCountdown(executeRaffle);
  }, [isRaffling, currentCount, availableCount, runWithCountdown, executeRaffle]);

  /**
   * Digit by digit raffle: each step reveals one more digit
   */
  const runDigitRaffleStep = useCallback(() => {
    if (isRaffling || currentCount !== null) return;

    // Start a new raffle if none exists or if the previous one is finished
    if (!winner || revealedCount >= digitCount) {
      if (availableCount === 0) return;

      const startNewDigitRaffle = () => {
        setIsRaffling(true);
        setRevealedCount(0);
        setWinner(null);

        schedule(() => {
          const newWinner = generateWinner();
          setIsRaffling(false);
          if (newWinner === null) return;
          setWinner(newWinner);
          setRevealedCount(1);
          if (digitCount === 1) addToHistory(newWinner);
        }, DIGIT_STEP_MS);
      };

      runWithCountdown(startNewDigitRaffle);

    } else {
      // Reveal the next digit
      const revealNextDigit = () => {
        setIsRaffling(true);

        schedule(() => {
          const newCount = revealedCount + 1;
          setRevealedCount(newCount);

          // If this was the last digit, add it to the history
          if (newCount === digitCount) {
            addToHistory(winner);
          }
          setIsRaffling(false);
        }, DIGIT_STEP_MS);
      };

      runWithCountdown(revealNextDigit);
    }
  }, [isRaffling, currentCount, winner, revealedCount, digitCount, availableCount, generateWinner, addToHistory, runWithCountdown, schedule]);

  const resetRaffle = useCallback(() => {
    cancelPendingTimers();
    setCurrentCount(null);
    setWinner(null);
    setIsRaffling(false);
    setRevealedCount(0);
  }, [cancelPendingTimers]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    resetRaffle();
  }, [setHistory, resetRaffle]);

  const deleteHistoryEntry = useCallback((id) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, [setHistory]);

  /**
   * Puts back a deleted entry at its original position (undo)
   */
  const restoreHistoryEntry = useCallback((entry, index) => {
    setHistory(prev => {
      if (prev.some(item => item.id === entry.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, entry);
      return next;
    });
  }, [setHistory]);

  const updateWinnerName = useCallback((id, name) => {
    setHistory(prev => prev.map(entry =>
      entry.id === id ? { ...entry, winnerName: name } : entry
    ));
  }, [setHistory]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    digitCount,
    setDigitCount,
    isRaffling,
    runTraditionalRaffle,
    runDigitRaffleStep,
    resetRaffle,
    winner,
    revealedCount,
    isManualRevealEnabled,
    setIsManualRevealEnabled,
    history,
    currentCount,
    isCountdownEnabled,
    setIsCountdownEnabled,
    countdownDuration,
    setCountdownDuration,
    isNoRepeatEnabled,
    setIsNoRepeatEnabled,
    isSoundEnabled,
    setIsSoundEnabled,
    availableCount,
    totalNumbers,
    clearHistory,
    deleteHistoryEntry,
    restoreHistoryEntry,
    updateWinnerName
  }), [
    digitCount, setDigitCount,
    isRaffling,
    runTraditionalRaffle, runDigitRaffleStep, resetRaffle,
    winner, revealedCount,
    isManualRevealEnabled, setIsManualRevealEnabled,
    history, currentCount,
    isCountdownEnabled, setIsCountdownEnabled,
    countdownDuration, setCountdownDuration,
    isNoRepeatEnabled, setIsNoRepeatEnabled,
    isSoundEnabled, setIsSoundEnabled,
    availableCount, totalNumbers,
    clearHistory, deleteHistoryEntry, restoreHistoryEntry, updateWinnerName
  ]);

  return (
    <RaffleContext.Provider value={value}>
      {children}
    </RaffleContext.Provider>
  );
};
