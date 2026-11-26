import { useRef, useState } from 'react';
import Modal from './Modal';
import { SOUND_CREDITS } from '../utils/soundCredits';

/** "Créditos de sonido" link + dialog with the attribution required by the sound licenses */
const SoundCredits = () => {
    const [isOpen, setIsOpen] = useState(false);
    const closeRef = useRef(null);

    return (
        <>
            <button type="button" className="footer-credits" onClick={() => setIsOpen(true)} aria-haspopup="dialog">
                Créditos de sonido
            </button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Créditos de sonido"
                className="credits-dialog"
                initialFocusRef={closeRef}
            >
                <ul className="credits-list">
                    {SOUND_CREDITS.map((credit) => (
                        <li key={credit.source}>
                            <a href={credit.source} target="_blank" rel="noopener noreferrer">“{credit.title}”</a>
                            {credit.author ? ` por ${credit.author}` : ''}. Licencia {credit.license}.
                            {' '}{credit.changes}
                        </li>
                    ))}
                </ul>
                <div className="modal-actions">
                    <button ref={closeRef} type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
                        Cerrar
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default SoundCredits;
