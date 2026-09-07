import PropTypes from 'prop-types';
import '../styles/Card.css';

const Card = ({
  image,
  title,
  description,
  buttonText,
  buttonLink,
  buttonClass,
  layout
}) => {
  const isRow = layout === 'row';
  
  return (
    <div className={`custom-card ${isRow ? 'card-row' : 'card-column'}`}>
      <div className="card-image-wrapper">
        <img src={image} alt={title} className="card-image" />
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        {description && <p className="card-description">{description}</p>}
        {buttonText && buttonLink && (
          <a href={buttonLink} target="_blank" rel="noopener noreferrer" className="card-button-link">
            <button className={`card-button ${buttonClass}`}>
              {buttonText}
            </button>
          </a>
        )}
      </div>
    </div>
  );
};

Card.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  buttonText: PropTypes.string,
  buttonLink: PropTypes.string,
  buttonClass: PropTypes.string,
  layout: PropTypes.oneOf(['row', 'column']),
};

Card.defaultProps = {
  description: '',
  buttonText: '',
  buttonLink: '',
  buttonClass: '',
  layout: 'column',
};

export default Card;
