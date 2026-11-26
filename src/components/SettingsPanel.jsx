import { memo, useState, useEffect, useCallback } from 'react';
import { useRaffle, MIN_DIGITS, MAX_DIGITS, MIN_COUNTDOWN, MAX_COUNTDOWN } from '../context/RaffleContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { clearAppData } from '../utils/resetApp';

const SettingsPanel = memo(({ isOpen, onClose }) => {
    const {
        digitCount, setDigitCount,
        isRaffling, resetRaffle,
        isManualRevealEnabled, setIsManualRevealEnabled,
        countdownDuration, setCountdownDuration,
        isCountdownEnabled, setIsCountdownEnabled,
        isNoRepeatEnabled, setIsNoRepeatEnabled,
        isSoundEnabled, setIsSoundEnabled,
        history, clearHistory
    } = useRaffle();

    const [inputValue, setInputValue] = useState(digitCount);
    const [countdownInputValue, setCountdownInputValue] = useState(countdownDuration);
    // Destructive action awaiting confirmation: 'history' | 'all' | null
    const [confirming, setConfirming] = useState(null);

    useEffect(() => {
        setInputValue(digitCount);
    }, [digitCount]);

    useEffect(() => {
        setCountdownInputValue(countdownDuration);
    }, [countdownDuration]);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setInputValue(value);

        const val = parseInt(value, 10);
        if (value !== '' && !isNaN(val) && val >= MIN_DIGITS && val <= MAX_DIGITS) {
            setDigitCount(val);
            resetRaffle();
        }
    }, [setDigitCount, resetRaffle]);

    const handleCountdownChange = useCallback((e) => {
        const value = e.target.value;
        setCountdownInputValue(value);

        const val = parseInt(value, 10);
        if (value !== '' && !isNaN(val) && val >= MIN_COUNTDOWN && val <= MAX_COUNTDOWN) {
            setCountdownDuration(val);
        }
    }, [setCountdownDuration]);

    const handleConfirm = useCallback(() => {
        if (confirming === 'all') {
            clearAppData(); // reloads the page
            return;
        }
        clearHistory();
        setConfirming(null);
    }, [confirming, clearHistory]);

    const handleCancelConfirm = useCallback(() => setConfirming(null), []);

    return (
        <>
            <Modal isOpen={isOpen && confirming === null} onClose={onClose} title="Configuración" className="settings-content">
                <div className="settings-field">
                    <label className="field-label" htmlFor="setting-digits">
                        Cantidad de Dígitos
                    </label>
                    <div className="field-row">
                        <input
                            id="setting-digits"
                            type="number"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={handleChange}
                            min={MIN_DIGITS}
                            max={MAX_DIGITS}
                            disabled={isRaffling}
                            aria-describedby="setting-digits-hint"
                        />
                        <span id="setting-digits-hint" className="field-hint">
                            (Min {MIN_DIGITS}, Max {MAX_DIGITS})
                        </span>
                    </div>
                </div>

                <div className="settings-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isCountdownEnabled}
                            onChange={(e) => setIsCountdownEnabled(e.target.checked)}
                            disabled={isRaffling}
                        />
                        Activar Conteo Regresivo
                    </label>

                    {isCountdownEnabled && (
                        <div className="field-row field-row-nested">
                            <label className="field-label field-label-inline" htmlFor="setting-countdown">
                                Segundos:
                            </label>
                            <input
                                id="setting-countdown"
                                type="number"
                                inputMode="numeric"
                                className="input-small"
                                value={countdownInputValue}
                                onChange={handleCountdownChange}
                                min={MIN_COUNTDOWN}
                                max={MAX_COUNTDOWN}
                                disabled={isRaffling}
                                aria-describedby="setting-countdown-hint"
                            />
                            <span id="setting-countdown-hint" className="field-hint">
                                (Min {MIN_COUNTDOWN}, Max {MAX_COUNTDOWN})
                            </span>
                        </div>
                    )}
                </div>

                <div className="settings-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isManualRevealEnabled}
                            onChange={(e) => setIsManualRevealEnabled(e.target.checked)}
                            disabled={isRaffling}
                        />
                        Revelación por Dígito (Manual)
                    </label>
                </div>

                <div className="settings-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isNoRepeatEnabled}
                            onChange={(e) => setIsNoRepeatEnabled(e.target.checked)}
                            disabled={isRaffling}
                        />
                        No repetir números ya sorteados
                    </label>
                </div>

                <div className="settings-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isSoundEnabled}
                            onChange={(e) => setIsSoundEnabled(e.target.checked)}
                        />
                        Activar sonido
                    </label>
                </div>

                <div className="settings-danger-zone">
                    <button
                        type="button"
                        className="btn-danger btn-block"
                        onClick={() => setConfirming('history')}
                        disabled={history.length === 0}
                    >
                        🗑️ Borrar Historial de Sorteos
                    </button>
                    <button
                        type="button"
                        className="btn-danger btn-block"
                        onClick={() => setConfirming('all')}
                        disabled={isRaffling}
                    >
                        🧹 Borrar Caché y Datos
                    </button>
                    <p className="field-hint">
                        Restablece la configuración, borra el historial y la copia sin conexión, y recarga la app.
                    </p>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-primary btn-compact" onClick={onClose}>
                        Guardar
                    </button>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={isOpen && confirming === 'history'}
                title="Borrar historial"
                message={`Se borrarán los ${history.length} resultados del historial. Esta acción no se puede deshacer.`}
                confirmLabel="Borrar todo"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />

            <ConfirmDialog
                isOpen={isOpen && confirming === 'all'}
                title="Borrar caché y datos"
                message={`Se borrarán la configuración y ${history.length === 1 ? 'el resultado' : `los ${history.length} resultados`} del historial, y la app se recargará como recién instalada. Si estás sin conexión, se conserva la copia sin conexión para que la app siga abriendo. Esta acción no se puede deshacer.`}
                confirmLabel="Borrar y recargar"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />
        </>
    );
});

SettingsPanel.displayName = 'SettingsPanel';

export default SettingsPanel;
