import { useEffect, useState, useMemo, memo } from 'react';
import { RaffleProvider, useRaffle } from './context/RaffleContext';
import { runWinnerCelebration } from './utils/confettiEffects';
import Layout from './components/Layout';
import RaffleDisplay from './components/RaffleDisplay';
import RaffleHistory from './components/RaffleHistory';
import SettingsPanel from './components/SettingsPanel';
import CountdownOverlay from './components/CountdownOverlay';
import Footer from './components/Footer';
import logoPacoreños from './assets/images/pacomede.jpg';

const RaffleContent = memo(() => {
  const {
    runTraditionalRaffle,
    runDigitRaffleStep,
    isRaffling,
    winner,
    revealedCount,
    digitCount,
    isManualRevealEnabled
  } = useRaffle();

  const isFinished = winner && revealedCount === digitCount;

  // Trigger celebration effect when raffle finishes
  useEffect(() => {
    if (isFinished) {
      runWinnerCelebration();
    }
  }, [isFinished]);

  const handleRaffleClick = () => {
    if (isManualRevealEnabled) {
      runDigitRaffleStep();
    } else {
      runTraditionalRaffle();
    }
  };

  // Memoize button text to avoid recalculating
  const buttonText = useMemo(() => {
    if (isRaffling) return 'Rifando...';
    if (isFinished) return 'Rifar de Nuevo';
    if (isManualRevealEnabled) {
      return winner ? 'Revelar Siguiente' : 'Revelar Dígito';
    }
    return 'Iniciar Rifa';
  }, [isRaffling, isFinished, isManualRevealEnabled, winner]);

  return (
    <div className="cards-stack">
      <div className="card card-raffle">
        <RaffleDisplay />

        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              onClick={handleRaffleClick}
              disabled={isRaffling}
              aria-label={buttonText}
            >
              {buttonText}
            </button>
          </div>
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

              <button
                onClick={handleOpenSettings}
                className="btn-settings"
                aria-label="Abrir configuración"
              >
                ⚙️ Configurar
              </button>
            </header>

            <RaffleContent />
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
