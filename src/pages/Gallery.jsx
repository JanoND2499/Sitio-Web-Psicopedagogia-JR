import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../styles/Gallery.css';

const Gallery = ({ title, images }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const openModal = (index) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const nextImage = useCallback(() => {
    setSelectedIndex((prevIndex) => 
      prevIndex === null ? null : (prevIndex + 1) % images.length
    );
  }, [images.length]);

  const prevImage = useCallback(() => {
    setSelectedIndex((prevIndex) => 
      prevIndex === null ? null : (prevIndex - 1 + images.length) % images.length
    );
  }, [images.length]);

  // Handle keyboard events (ArrowRight, ArrowLeft, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, nextImage, prevImage]);

  return (
    <>
      <div className="gallery-section animate-fade-in">
        <h1>{title}</h1>
        
        {/* GRID DE IMÁGENES */}
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="gallery-item-card" 
              onClick={() => openModal(index)}
            >
              <div className="gallery-item-overlay">
                <span className="zoom-icon">🔍 Ver</span>
              </div>
              <img 
                src={image.src} 
                alt={image.alt || `Galería En-Joy ${index + 1}`} 
                className="gallery-img-thumbnail" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CARRUSEL PERSONALIZADO */}
      {selectedIndex !== null && (
        <div className="custom-modal-backdrop" onClick={closeModal}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* BOTÓN CERRAR */}
            <button className="modal-close-btn" onClick={closeModal} aria-label="Cerrar galería">
              &times;
            </button>

            {/* CONTENEDOR CARRUSEL */}
            <div className="modal-carousel">
              <button 
                className="carousel-control-btn prev-btn" 
                onClick={prevImage}
                aria-label="Imagen anterior"
              >
                &#10094;
              </button>
              
              <div className="carousel-image-container">
                <img 
                  src={images[selectedIndex].src} 
                  alt={images[selectedIndex].alt || 'Imagen ampliada'} 
                  className="carousel-main-image"
                />
                <div className="carousel-caption">
                  <p>{images[selectedIndex].alt}</p>
                  <span>{selectedIndex + 1} / {images.length}</span>
                </div>
              </div>

              <button 
                className="carousel-control-btn next-btn" 
                onClick={nextImage}
                aria-label="Siguiente imagen"
              >
                &#10095;
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

Gallery.propTypes = {
  title: PropTypes.string.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
    })
  ).isRequired,
};

export default Gallery;
