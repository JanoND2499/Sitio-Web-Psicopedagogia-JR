import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Footer from './components/Footer';

// IMPORT ASSETS - HOME
import bannerImage from './assets/images/banner-principal.png';
import profileImage from './assets/images/enjoy-logo.jpeg';

// IMPORT ASSETS - SERVICES
import chicosJugandoImg from './assets/images/services/chicos_jugando.jpeg';
import tallerImg from './assets/images/services/taller.jpeg';
import acompanandoImg from './assets/images/services/acompanando.jpeg';
import jugandoImg from './assets/images/services/jugando.jpeg';
import numerosImg from './assets/images/services/numeros.jpeg';
import pictogramasImg from './assets/images/services/pictogramas.jpeg';
import plastilinaImg from './assets/images/services/plastilina.jpeg';
import abecedarioImg from './assets/images/services/abecedario.jpeg';
import rompecabezasImg from './assets/images/services/rompecabezas.jpeg';

import './App.css';

function App() {
  // Services Gallery images payload
  const galleryImages = [
    { src: chicosJugandoImg, alt: 'Chicos jugando y aprendiendo en consulta' },
    { src: tallerImg, alt: 'Taller educativo grupal y recreación' },
    { src: acompanandoImg, alt: 'Acompañamiento personalizado en aprendizaje' },
    { src: jugandoImg, alt: 'Juegos didácticos interactivos' },
    { src: numerosImg, alt: 'Ejercicios de estimulación cognitiva matemática' },
    { src: pictogramasImg, alt: 'Método de comunicación con pictogramas' },
    { src: plastilinaImg, alt: 'Motricidad fina mediante plastilina' },
    { src: abecedarioImg, alt: 'Proceso de alfabetización lúdico' },
    { src: rompecabezasImg, alt: 'Estimulación del razonamiento lógico' },
  ];

  return (
    <Router>
      <Navbar />
      
      <div className="main-content">
        <Routes>
          {/* INICIO */}
          <Route 
            path="/" 
            element={
              <Home 
                bannerImage={bannerImage}
                profileImage={profileImage}
                title="Bienvenidos a EN-JOY Psicopedagogía"
                subtitle="Acompañamiento respetuoso y amoroso"
                description={
                  <>
                    Hola, soy <strong>Joana Reche</strong>, JOY para la familia. La
                    palabra &quot;Joy&quot; en inglés significa &quot;alegría&quot;, y esa es precisamente la
                    esencia de mi trabajo. Soy Licenciada y Profesora en Psicopedagogía. Y
                    Actualmente, tengo la oportunidad de trabajar en instituciones
                    escolares. Acompaño el aprendizaje de niños de forma personalizada,
                    respetuosa y amorosa, potenciando sus habilidades y fortaleciendo su
                    desarrollo.
                  </>
                }
                button1Text="Un poco sobre mí"
                button1Path="/sobre-mi"
                button2Text="Solicitar turno"
                button2Path="/contacto"
              />
            } 
          />

          {/* SOBRE MI */}
          <Route path="/sobre-mi" element={<About />} />

          {/* SERVICIOS / GALERIA */}
          <Route 
            path="/servicios" 
            element={
              <Gallery 
                title="Psicope, trabajo y mucho amor" 
                images={galleryImages}
              />
            } 
          />

          {/* CONTACTO */}
          <Route path="/contacto" element={<Contact />} />
        </Routes>
      </div>

      <Footer />
    </Router>
  );
}

export default App;
