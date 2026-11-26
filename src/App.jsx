import { useEffect, useState, useMemo, memo } from 'react';
import { RaffleProvider, useRaffle } from './context/RaffleContext';
import { runWinnerCelebration } from './utils/confettiEffects';
import { playReveal, playWinnerSound, preloadSounds, stopDrumRoll } from './utils/sound';
import FullscreenButton from './components/FullscreenButton';
import Layout from './components/Layout';
import RaffleDisplay from './components/RaffleDisplay';
import RaffleHistory from './components/RaffleHistory';
import SettingsPanel from './components/SettingsPanel';
import CountdownOverlay from './components/CountdownOverlay';
import Footer from './components/Footer';
import useOnlineStatus from './hooks/useOnlineStatus';
import useLatestCallback from './hooks/useLatestCallback';
import logoPacoreños from './assets/images/pacomede.jpg';

// Elements whose own Space/Enter behavior must not trigger the raffle
const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a, [contenteditable="true"]';

const RaffleContent = memo(({ shortcutsEnabled }) => {
  const {
    runTraditionalRaffle,
    runDigitRaffleStep,
    isRaffling,
    winner,
    revealedCount,
    digitCount,
    isManualRevealEnabled,
    isNoRepeatEnabled,
    isSoundEnabled,
    availableCount,
    currentCount
  } = useRaffle();

  const isFinished = Boolean(winner) && revealedCount === digitCount;
  // No numbers left (only matters when a new raffle would start)
  const isExhausted = availableCount === 0 && (!winner || isFinished);
  const isBusy = isRaffling || currentCount !== null;

  // Trigger celebration effect when raffle finishes
  useEffect(() => {
    if (isFinished) {
      runWinnerCelebration();
    }
  }, [isFinished]);

  // Sounds: when the number shows, the drum roll ends in a crash + applause
  // (or a short blip for an intermediate digit in manual mode)
  const playRevealSound = useLatestCallback((isLastDigit) => {
    if (!isSoundEnabled) return;
    if (isLastDigit) playWinnerSound();
    else playReveal();
  });
  useEffect(() => {
    if (!winner || revealedCount === 0) return;
    playRevealSound(revealedCount === digitCount);
  }, [winner, revealedCount, digitCount, playRevealSound]);

  // Never leave the drum roll playing on its own: stop it when nothing is in progress
  // (raffle cancelled, no numbers left) or when sound is turned off
  useEffect(() => {
    if (!isSoundEnabled || (!isRaffling && currentCount === null)) stopDrumRoll();
  }, [isSoundEnabled, isRaffling, currentCount]);
  useEffect(() => stopDrumRoll, []);

  // Load the recorded sounds as soon as sound is on, so the first roll starts on time
  useEffect(() => {
    if (isSoundEnabled) preloadSounds();
  }, [isSoundEnabled]);

  const handleRaffleClick = () => {
    if (isManualRevealEnabled) {
      runDigitRaffleStep();
    } else {
      runTraditionalRaffle();
    }
  };

  // Keyboard shortcut: Space / Enter starts the raffle or reveals the next digit
  const onShortcut = useLatestCallback(() => {
    if (!isBusy && !isExhausted) handleRaffleClick();
  });
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;
      e.preventDefault();
      onShortcut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsEnabled, onShortcut]);

  // Memoize button text to avoid recalculating
  const buttonText = useMemo(() => {
    if (isRaffling) return 'Rifando...';
    if (isExhausted) return 'Sin números disponibles';
    if (isFinished) return 'Rifar de Nuevo';
    if (isManualRevealEnabled) {
      return winner ? 'Revelar Siguiente' : 'Revelar Dígito';
    }
    return 'Iniciar Rifa';
  }, [isRaffling, isExhausted, isFinished, isManualRevealEnabled, winner]);

  return (
    <div className="cards-stack">
      <section className="card card-raffle" aria-label="Sorteo">
        <RaffleDisplay />

        <div className="raffle-controls">
          <button
            type="button"
            className="btn-primary btn-raffle"
            onClick={handleRaffleClick}
            disabled={isBusy || isExhausted}
          >
            {buttonText}
          </button>
          <p className="raffle-hint">
            {isNoRepeatEnabled && (
              <span>
                {availableCount === 1 ? 'Queda 1 número disponible' : `Quedan ${availableCount} números disponibles`}
              </span>
            )}
            <span className="shortcut-hint">Espacio o Enter para sortear</span>
          </p>
        </div>
      </section>

      {/* Live region: screen readers announce the winner when it appears */}
      <section className="card card-result" aria-live="polite" aria-atomic="true">
        <h2 className={`card-title ${isFinished ? 'has-winner' : ''}`}>
          {isFinished ? '¡Tenemos un Ganador!' : 'Próximo Ganador'}
        </h2>

        {isFinished ? (
          <div className="winner-announcement">
            <div className="winner-result-box">
              <span className="winner-emoji" aria-hidden="true">🎉</span>
              <span className="winner-text">¡Felicidades al número {winner}!</span>
              <span className="winner-emoji" aria-hidden="true">🎉</span>
            </div>
          </div>
        ) : (
          // Same size as the real announcement, so the layout doesn't jump when it appears
          <div className="winner-announcement is-placeholder" aria-hidden="true">
            <div className="winner-result-box">
              <span className="winner-text">Aquí aparecerá el ganador</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

RaffleContent.displayName = 'RaffleContent';

const OfflineBadge = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <span className="offline-badge" role="status" title="La app sigue funcionando sin conexión">
      Sin conexión
    </span>
  );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => setIsSettingsOpen(false);

  return (
    <RaffleProvider>
      <Layout>
        <div className="main-content-container">
          <RaffleHistory />
          <div className="cards-wrapper">
            <header className="header-container">
              <div className="logo-container">
                <img src={logoPacoreños} alt="Logo Pacoreños" className="logo-image" />
                <h1 className="logo-text">
                  Gran Rifa - <span className="client-highlight">Pacoreños en</span> <span className="city-highlight">Medellín</span>
                </h1>
              </div>

              <div className="header-actions">
                <OfflineBadge />
                <FullscreenButton />
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className="btn-settings"
                  aria-label="Abrir configuración"
                  aria-haspopup="dialog"
                >
                  <span aria-hidden="true">⚙️</span>
                  <span className="btn-label">Configurar</span>
                </button>
              </div>
            </header>

            <RaffleContent shortcutsEnabled={!isSettingsOpen} />
          </div>
        </div>
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={handleCloseSettings}
        />
        <CountdownOverlay />
        <Footer />
      </Layout>
    </RaffleProvider>
  );
}

export default App;
