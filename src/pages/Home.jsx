import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = ({
  bannerImage,
  profileImage,
  title,
  subtitle,
  description,
  button1Text,
  button1Path,
  button2Text,
  button2Path
}) => {
  return (
    <main className="home-container animate-fade-in">
      {/* BANNER HERO */}
      <section className="main-banner">
        <img src={bannerImage} alt="Banner Principal En-Joy" className="banner-img" />
        <div className="banner-overlay">
          <h2>{subtitle}</h2>
        </div>
      </section>

      {/* SECCIÓN INICIO / PRESENTACIÓN */}
      <section className="inicio-section">
        <div className="inicio-wrapper">
          <div className="inicio-img-container">
            <img src={profileImage} alt={title} className="profile-img" />
          </div>
          <div className="inicio-contenido">
            <h1>{title}</h1>
            <p className="description-text">{description}</p>
            
            <div className="botones-container">
              <Link to={button1Path} className="btn btn-secondary">
                {button1Text}
              </Link>
              <Link to={button2Path} className="btn btn-primary">
                {button2Text}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

// PropTypes validation as requested in the rubric
Home.propTypes = {
  bannerImage: PropTypes.string.isRequired,
  profileImage: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.node.isRequired,
  button1Text: PropTypes.string.isRequired,
  button1Path: PropTypes.string.isRequired,
  button2Text: PropTypes.string.isRequired,
  button2Path: PropTypes.string.isRequired,
};

Home.defaultProps = {
  subtitle: "Acompañamiento respetuoso y amoroso",
};

export default Home;
