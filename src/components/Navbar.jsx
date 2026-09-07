import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logoHeader from '../assets/images/logo-header.jpeg';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="header-container">
      <nav className="navbar">
        {/* LOGO */}
        <div className="navbar-logo">
          <NavLink to="/" onClick={closeMenu}>
            <img src={logoHeader} alt="En-Joy Psicopedagogía" />
          </NavLink>
        </div>

        {/* HAMBURGER MENÚ PARA MOBILE */}
        <button 
          className={`navbar-toggle ${isOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Abrir menú de navegación"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* MENÚ CENTRO */}
        <ul className={`navbar-menu ${isOpen ? 'show' : ''}`}>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/sobre-mi" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Sobre mí
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/servicios" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Servicios
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/contacto" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Contacto
            </NavLink>
          </li>
        </ul>

        {/* DERECHA (UBICACIÓN) */}
        <div className="navbar-ubicacion">
          <a 
            href="https://maps.app.goo.gl/JUxe1CkRGrEfWtMj9" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            📍 San Nicolás
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
