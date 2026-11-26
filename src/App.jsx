import { useEffect, useEffectEvent, useState, useMemo, memo } from 'react';
import { RaffleProvider, useRaffle } from './context/RaffleContext';
import { runWinnerCelebration } from './utils/confettiEffects';
import { playFanfare, playReveal } from './utils/sound';
import FullscreenButton from './components/FullscreenButton';
import Layout from './components/Layout';
import RaffleDisplay from './components/RaffleDisplay';
import RaffleHistory from './components/RaffleHistory';
import SettingsPanel from './components/SettingsPanel';
import CountdownOverlay from './components/CountdownOverlay';
import Footer from './components/Footer';
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

  // Sounds: fanfare on winner, blip on each intermediate manual reveal
  const playRevealSound = useEffectEvent((isLastDigit) => {
    if (!isSoundEnabled) return;
    if (isLastDigit) playFanfare();
    else playReveal();
  });
  useEffect(() => {
    if (!winner || revealedCount === 0) return;
    playRevealSound(revealedCount === digitCount);
  }, [winner, revealedCount, digitCount]);

  const handleRaffleClick = () => {
    if (isManualRevealEnabled) {
      runDigitRaffleStep();
    } else {
      runTraditionalRaffle();
    }
  };

  // Keyboard shortcut: Space / Enter starts the raffle or reveals the next digit
  const onShortcut = useEffectEvent(() => {
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
  }, [shortcutsEnabled]);

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
      <div className="card card-raffle">
        <RaffleDisplay />

        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              onClick={handleRaffleClick}
              disabled={isBusy || isExhausted}
              aria-label={buttonText}
            >
              {buttonText}
            </button>
          </div>
          <p className="raffle-hint">
            {isNoRepeatEnabled && (
              <span>
                {availableCount === 1 ? 'Queda 1 número disponible' : `Quedan ${availableCount} números disponibles`}
              </span>
            )}
            <span className="shortcut-hint">Espacio o Enter para sortear</span>
          </p>
        </div>
      </div>

      <div className="card card-result">
        <h2 className={`card-title ${isFinished ? 'has-winner' : ''}`}>
          {isFinished ? '¡Tenemos un Ganador!' : 'Próximo Ganador'}
        </h2>

        {isFinished && (
          <div className="winner-announcement" style={{ marginTop: 0, animation: 'slideIn 0.5s ease' }}>
            <div className="winner-result-box" style={{ justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <span className="winner-text">¡Felicidades al número {winner}!</span>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RaffleContent.displayName = 'RaffleContent';

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
                <FullscreenButton />
                <button
                  onClick={handleOpenSettings}
                  className="btn-settings"
                  aria-label="Abrir configuración"
                >
                  ⚙️ Configurar
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
