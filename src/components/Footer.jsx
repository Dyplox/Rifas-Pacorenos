import { memo } from 'react';

const Footer = memo(() => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-container">
            <div className="footer-content">
                <p className="footer-copyright">
                    Copyright: © {currentYear}
                    <span className="client-highlight"> Pacoreños en </span>
                    <span className="footer-brand">Medellín y Antioquia</span>.
                    Todos los derechos reservados.
                </p>
                <p className="footer-author">
                    Sujeto a términos y condiciones - Desarrollado por <a href="https://www.linkedin.com/in/abelguar" target="_blank" rel="noopener noreferrer" className="author-name">@AbelGuAr</a>
                </p>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
