import logoFooter from '../assets/images/logo-footer.jpg';
import whatsappIcon from '../assets/images/icons/whatsapp.png';
import instagramIcon from '../assets/images/icons/instagram.png';
import facebookIcon from '../assets/images/icons/facebook.png';
import gmailIcon from '../assets/images/icons/gmail.png';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <section className="footer-content">
        {/* COLUMNA IZQUIERDA (UBICACIÓN MAPA) */}
        <div className="footer-column inst-ubicacion">
          <h4>INSTITUTO ARCOIRIS</h4>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3333.2762007799124!2d-60.22786432458924!3d-33.33773329174793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b767907cea186f%3A0x920a6596abdf4711!2sObligado%2034%2C%20B2900%20San%20Nicol%C3%A1s%20de%20Los%20Arroyos%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1775142646479!5m2!1ses-419!2sar"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación Instituto Arcoiris"
          ></iframe>
        </div>

        {/* COLUMNA CENTRO (LOGO + DERECHOS) */}
        <div className="footer-column derechos">
          <img
            src={logoFooter}
            alt="Logo Enjoy Psicopedagogía con frase"
            className="footer-logo"
          />
          <p className="copyright-text">
            © Copyright {new Date().getFullYear()}; Diseñado por{' '}
            <a 
              href="https://github.com/JanoND2499" 
              target="_blank" 
              rel="noopener noreferrer"
              className="designer-link"
            >
              Jano Duarte
            </a>
          </p>
        </div>

        {/* COLUMNA DERECHA (REDES SOCIALES) */}
        <div className="footer-column contact-column">
          <h4>CONTACTANOS</h4>
          <ul className="contact-list">
            <li>
              <a 
                href="https://wa.me/3364206772" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Escribir por WhatsApp"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="social-icon" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.instagram.com/enjoypsicopedagogia/" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Síguenos en Instagram"
              >
                <img src={instagramIcon} alt="Instagram" className="social-icon" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.facebook.com/profile.php?id=61575074511990" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Síguenos en Facebook"
              >
                <img src={facebookIcon} alt="Facebook" className="social-icon" />
              </a>
            </li>
            <li>
              <a 
                href="mailto:joyreche@gmail.com" 
                title="Enviar correo"
              >
                <img src={gmailIcon} alt="Gmail" className="social-icon" />
              </a>
            </li>
          </ul>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
