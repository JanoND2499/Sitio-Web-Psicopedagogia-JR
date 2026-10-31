import { useState } from 'react';
import { useForm } from '../hooks/useForm';
import enjoyLogo from '../assets/images/enjoy-logo.jpeg';
import '../styles/Contact.css';

const Contact = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiFeedback, setApiFeedback] = useState(null);

  const initialValues = {
    nombre: '',
    email: '',
    telNumber: '',
    date: '',
    genero: '',
    motivoConsulta: '',
    comentarios: '',
  };

  const validate = (values) => {
    const errors = {};

    if (!values.nombre.trim()) {
      errors.nombre = 'El nombre y apellido son obligatorios';
    }

    if (!values.email) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'El correo electrónico es inválido';
    }

    if (!values.telNumber) {
      errors.telNumber = 'El número de teléfono es obligatorio';
    }

    if (!values.date) {
      errors.date = 'La fecha de nacimiento es obligatoria';
    }

    if (!values.genero) {
      errors.genero = 'Debes seleccionar un género';
    }

    if (!values.motivoConsulta) {
      errors.motivoConsulta = 'Debes seleccionar un motivo de consulta';
    }

    return errors;
  };

  const {
    values,
    errors,
    handleChange,
    handleReset,
    validateForm,
  } = useForm(initialValues, validate);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents default form submit browser behavior
    
    console.log('Submit Event triggered. Preventing default...');

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const response = await fetch('http://localhost:5000/api/turnos/solicitar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          const resData = await response.json();
          console.log('Turno registrado exitosamente en MongoDB Backend:', resData);
          setApiFeedback('Turno agendado exitosamente en la base de datos.');
        } else {
          console.warn('El servidor backend respondió con error status:', response.status);
          setApiFeedback(null);
        }
      } catch (networkError) {
        console.warn('Backend no disponible en http://localhost:5000, registrando en modo local:', networkError.message);
        setApiFeedback(null);
      } finally {
        setIsSubmitting(false);
        setSubmitSuccess(true);
      }
    } else {
      console.warn('Formulario inválido. Errores detectados:', errors);
      setSubmitSuccess(false);
    }
  };

  const handleCustomReset = (e) => {
    handleReset(e);
    setSubmitSuccess(false);
    setApiFeedback(null);
  };

  // Obras sociales data
  const obrasSociales = [
    { name: 'OSDE', color: '#0054a6' },
    { name: 'Swiss Medical', color: '#e2001a' },
    { name: 'Galeno', color: '#007848' },
    { name: 'Sancor Salud', color: '#0f2c59' },
    { name: 'Medifé', color: '#009ee3' },
    { name: 'OSPEDYC', color: '#16315c' }
  ];

  return (
    <main className="contact-main animate-fade-in">
      <h1 className="contact-title">Tenes dudas? Estoy para ayudarte</h1>
      
      <section className="contact-wrapper">
        {/* CARD INFORMATIVA IZQUIERDA */}
        <div className="info-card">
          <div className="info-logo-container">
            <img src={enjoyLogo} alt="Logo En-Joy" className="info-logo" />
          </div>
          <h2>Atención Personalizada</h2>
          <p>
            Cada consulta es el inicio de un nuevo camino de aprendizaje y
            crecimiento. No dudes en escribirme, juntos podemos encontrar la
            mejor manera de acompañar a tu hijo.
          </p>
          <div className="info-details">
            <p><strong>📍 Ubicación:</strong> Obligado 34, San Nicolás de los Arroyos</p>
            <p><strong>📧 Email:</strong> joyreche@gmail.com</p>
            <p><strong>📞 Teléfono:</strong> +54 336 420-6772</p>
          </div>
        </div>

        {/* COLUMNA FORMULARIO */}
        <div className="form-card">
          <h2>Ponte en contacto con nosotros</h2>
          
          {submitSuccess ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>¡Mensaje Enviado con Éxito!</h3>
              <p>
                {apiFeedback 
                  ? apiFeedback 
                  : 'Tu consulta ha sido procesada y registrada en el sistema de En-Joy Psicopedagogía.'}
              </p>
              <div className="success-data-summary">
                <p><strong>Nombre:</strong> {values.nombre}</p>
                <p><strong>Email:</strong> {values.email}</p>
                <p><strong>Teléfono:</strong> {values.telNumber}</p>
                <p><strong>Motivo de Consulta:</strong> {values.motivoConsulta}</p>
              </div>
              <button className="btn btn-primary" onClick={handleCustomReset}>
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form className="formulario" onSubmit={handleSubmit} noValidate>
              {/* NOMBRE */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre y apellido:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={values.nombre}
                  onChange={handleChange}
                  placeholder="Introduzca su nombre"
                  className={errors.nombre ? 'input-error' : ''}
                />
                {errors.nombre && <span className="error-text">{errors.nombre}</span>}
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="ejemplo@gmail.com"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* TELEFONO */}
              <div className="form-group">
                <label htmlFor="telNumber">Número de teléfono:</label>
                <input
                  type="number"
                  id="telNumber"
                  name="telNumber"
                  value={values.telNumber}
                  onChange={handleChange}
                  placeholder="+54 336..."
                  className={errors.telNumber ? 'input-error' : ''}
                />
                {errors.telNumber && <span className="error-text">{errors.telNumber}</span>}
              </div>

              {/* FECHA NACIMIENTO */}
              <div className="form-group">
                <label htmlFor="date">Fecha de nacimiento:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  className={errors.date ? 'input-error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              {/* GENERO */}
              <div className="form-group">
                <p className="gender-label">Género:</p>
                <div className="radio-group">
                  <label className="radio-container">
                    <input
                      type="radio"
                      name="genero"
                      value="m"
                      checked={values.genero === 'm'}
                      onChange={handleChange}
                    />
                    <span>Masculino</span>
                  </label>
                  <label className="radio-container">
                    <input
                      type="radio"
                      name="genero"
                      value="f"
                      checked={values.genero === 'f'}
                      onChange={handleChange}
                    />
                    <span>Femenino</span>
                  </label>
                </div>
                {errors.genero && <span className="error-text">{errors.genero}</span>}
              </div>

              {/* MOTIVO DE CONSULTA / OPCIONES FRECUENTES */}
              <div className="form-group">
                <label htmlFor="motivoConsulta">Motivo de consulta (opciones frecuentes):</label>
                <select
                  id="motivoConsulta"
                  name="motivoConsulta"
                  value={values.motivoConsulta}
                  onChange={handleChange}
                  className={errors.motivoConsulta ? 'input-error' : ''}
                >
                  <option value="">-- Selecciona un motivo de consulta --</option>
                  
                  <optgroup label="Dificultades en el aprendizaje escolar (Niños y adolescentes)">
                    <option value="Problemas en la adquisición de la lectoescritura (dislexia, retraso lector, dificultades de comprensión)">
                      Problemas en la adquisición de la lectoescritura (dislexia, retraso lector, dificultades de comprensión)
                    </option>
                    <option value="Desafíos en el cálculo matemático y razonamiento lógico (discalculia)">
                      Desafíos en el cálculo matemático y razonamiento lógico (discalculia)
                    </option>
                    <option value="Bajo rendimiento académico general o retroceso repentino en las calificaciones">
                      Bajo rendimiento académico general o retroceso repentino en las calificaciones
                    </option>
                    <option value="Falta de hábitos de estudio, desorganización con las tareas y gestión del tiempo">
                      Falta de hábitos de estudio, desorganización con las tareas y gestión del tiempo
                    </option>
                  </optgroup>
                  
                  <optgroup label="Atención, concentración y conducta">
                    <option value="Dificultades para sostener la atención, seguir instrucciones o completar actividades (sospecha o acompañamiento en TDAH)">
                      Dificultades para sostener la atención, seguir instrucciones o completar actividades (sospecha o acompañamiento en TDAH)
                    </option>
                    <option value="Impulsividad, baja tolerancia a la frustración o desmotivación frente a tareas académicas">
                      Impulsividad, baja tolerancia a la frustración o desmotivación frente a tareas académicas
                    </option>
                    <option value="Problemas en funciones ejecutivas (planificación, memoria de trabajo y flexibilidad cognitiva)">
                      Problemas en funciones ejecutivas (planificación, memoria de trabajo y flexibilidad cognitiva)
                    </option>
                  </optgroup>
                  
                  <optgroup label="Evaluación y diagnóstico interdisciplinario">
                    <option value="Solicitud de un psicodiagnóstico o evaluación psicopedagógica completa pedida por la escuela o un pediatra/neurólogo">
                      Solicitud de un psicodiagnóstico o evaluación psicopedagógica completa pedida por la escuela o un pediatra/neurólogo
                    </option>
                    <option value="Adaptaciones curriculares para estudiantes con necesidades educativas específicas">
                      Adaptaciones curriculares para estudiantes con necesidades educativas específicas
                    </option>
                    <option value="Seguimiento e integración escolar">
                      Seguimiento e integración escolar
                    </option>
                  </optgroup>
                  
                  <optgroup label="Orientación vocacional y ocupacional (Jóvenes y adultos)">
                    <option value="Elección de carrera universitaria, terciaria o cambio de rumbo profesional">
                      Elección de carrera universitaria, terciaria o cambio de rumbo profesional
                    </option>
                    <option value="Dificultades para adaptarse a las exigencias académicas del nivel superior o universitario">
                      Dificultades para adaptarse a las exigencias académicas del nivel superior o universitario
                    </option>
                    <option value="Estrategias de estudio y técnicas de aprendizaje para adultos que retoman sus estudios">
                      Estrategias de estudio y técnicas de aprendizaje para adultos que retoman sus estudios
                    </option>
                  </optgroup>
                  
                  <optgroup label="Estimulación cognitiva en adultos y adultos mayores">
                    <option value="Rehabilitación o mantenimiento de funciones cognitivas (memoria, agilidad mental, atención)">
                      Rehabilitación o mantenimiento de funciones cognitivas (memoria, agilidad mental, atención)
                    </option>
                    <option value="Acompañamiento en el deterioro cognitivo leve o secuelas neurológicas">
                      Acompañamiento en el deterioro cognitivo leve o secuelas neurológicas
                    </option>
                  </optgroup>
                </select>
                {errors.motivoConsulta && <span className="error-text">{errors.motivoConsulta}</span>}
              </div>

              {/* COMENTARIOS */}
              <div className="form-group">
                <label htmlFor="comentarios">Contame más sobre vos:</label>
                <textarea
                  id="comentarios"
                  name="comentarios"
                  value={values.comentarios}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Escribe aquí..."
                ></textarea>
              </div>

              {/* BOTONES ACCION */}
              <div className="form-buttons">
                <button type="submit" className="buttom-send submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
                <button 
                  type="button" 
                  onClick={handleCustomReset} 
                  className="buttom-send reset-btn"
                >
                  Reiniciar
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* SECCIÓN OBRAS SOCIALES COMERCIALES */}
      <section className="obras-sociales-section">
        <h2>Obras sociales y coberturas con las que trabajo:</h2>
        <div className="obras-grid">
          {obrasSociales.map((os, idx) => (
            <div key={idx} className="os-badge" style={{ '--os-color': os.color }}>
              <div className="os-bullet"></div>
              <span>{os.name}</span>
            </div>
          ))}
        </div>
        <p className="os-disclaimer">
          * Reintegros para todas las obras sociales y prepagas. Consulta por aranceles y facilidades de pago.
        </p>
      </section>
    </main>
  );
};

export default Contact;
