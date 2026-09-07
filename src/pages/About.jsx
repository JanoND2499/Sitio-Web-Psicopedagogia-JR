import Card from '../components/Card';

// IMPORT ASSETS - ABOUT
import graduacionImg from '../assets/images/about/graduacion.png';
import tituloPsicopedagogiaImg from '../assets/images/about/titulo-psicopedagogia.jpeg';
import tituloUaiImg from '../assets/images/about/titulo-uai.jpeg';
import neurodiversidadImg from '../assets/images/about/neurodiversidad.jpeg';
import acompananteTerapeuticoImg from '../assets/images/about/acompañante-terapeutico.jpeg';
import estimulacionTempranaImg from '../assets/images/about/estimulacion-temprana.jpeg';
import alfabetizacionImg from '../assets/images/about/alfabetizacion.jpeg';
import infanciasImg from '../assets/images/about/infancias.jpeg';

const About = () => {
  return (
    <main className="about-page-container animate-fade-in">
      <h1>Un poco sobre mí</h1>
      
      {/* CARD PRINCIPAL */}
      <section className="card-principal-section">
        <Card 
          image={graduacionImg}
          title="Licenciada en Psicopedagogía"
          description="Esta diplomatura me permitió formarme para acompañar a cada persona en su proceso de aprendizaje, entendiendo que todos aprendemos de manera diferente. A lo largo de la formación incorporé herramientas para detectar dificultades, potenciar habilidades y brindar un acompañamiento respetuoso, adaptado a las necesidades de cada niño, adolescente o adulto. El enfoque está puesto en escuchar, comprender y ayudar a que cada uno pueda desarrollar su máximo potencial en un entorno de confianza."
          buttonText="Universidad Abierta Interamericana"
          buttonLink="https://uai.edu.ar/"
          layout="row"
        />
      </section>

      {/* FORMACIÓN ACADÉMICA */}
      <section className="formacion-section">
        <h2>Formación Académica</h2>
        <div className="cards-grid">
          <Card 
            image={tituloPsicopedagogiaImg}
            title="Título Licenciada en Psicopedagogía"
            buttonText="Universidad Abierta Interamericana"
            buttonLink="https://uai.edu.ar/"
            buttonClass="button_academica"
            layout="column"
          />
          <Card 
            image={tituloUaiImg}
            title="Profesora de nivel secundario y superior en Psicopedagogía"
            buttonText="Universidad Abierta Interamericana"
            buttonLink="https://uai.edu.ar/"
            buttonClass="button_academica"
            layout="column"
          />
        </div>
      </section>

      {/* FORMACIÓN PROFESIONAL */}
      <section className="formacion-section">
        <h2>Formación Profesional</h2>
        <div className="cards-grid">
          <Card 
            image={neurodiversidadImg}
            title="Adaptaciones curriculares para la neurodiversidad"
            buttonText="Universidad Abierta Interamericana"
            buttonLink="https://uai.edu.ar/"
            buttonClass="button_formacion"
            layout="column"
          />
          <Card 
            image={acompananteTerapeuticoImg}
            title="Curso de Acompañamiento Terapéutico"
            buttonText="Fude Educativo"
            buttonLink="https://www.educativo.net/"
            buttonClass="button_formacion"
            layout="column"
          />
          <Card 
            image={estimulacionTempranaImg}
            title="Curso de Estimulación Temprana"
            buttonText="Fude Educativo"
            buttonLink="https://www.educativo.net/"
            buttonClass="button_formacion"
            layout="column"
          />
          <Card 
            image={alfabetizacionImg}
            title="Gestos fonológicos en procesos de Alfabetización"
            buttonText="Fledni"
            buttonLink="https://fledni.org/"
            buttonClass="button_formacion"
            layout="column"
          />
          <Card 
            image={infanciasImg}
            title="Taller recreativo en Infancias"
            buttonText="Centro Conatus"
            buttonLink="https://www.instagram.com/centro_conatus/"
            buttonClass="button_formacion"
            layout="column"
          />
        </div>
      </section>
    </main>
  );
};

export default About;
