const Turno = require('../models/turnoModel');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');

class TurnoService {
  /**
   * Obtener todos los turnos con populate de Paciente y Servicio
   */
  async getAll(query = {}) {
    const filter = {};
    if (query.estado) {
      filter.estado = query.estado;
    }
    if (query.pacienteId) {
      filter.pacienteId = query.pacienteId;
    }
    if (query.servicioId) {
      filter.servicioId = query.servicioId;
    }

    return await Turno.find(filter)
      .populate('pacienteId', 'nombre email telNumber fechaNacimiento genero')
      .populate('servicioId', 'nombre descripcion duracionMinutos precio activo')
      .sort({ fechaHora: 1 });
  }

  /**
   * Obtener un turno específico por ID con populate
   */
  async getById(id) {
    const turno = await Turno.findById(id)
      .populate('pacienteId', 'nombre email telNumber fechaNacimiento genero')
      .populate('servicioId', 'nombre descripcion duracionMinutos precio activo');

    if (!turno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return turno;
  }

  /**
   * Crear un nuevo turno verificando existencia de relaciones
   */
  async create(turnoData) {
    // Verificar que el paciente exista
    const paciente = await User.findById(turnoData.pacienteId);
    if (!paciente) {
      const error = new Error(`El paciente con ID '${turnoData.pacienteId}' no existe`);
      error.statusCode = 400;
      throw error;
    }

    // Verificar que el servicio exista
    const servicio = await Service.findById(turnoData.servicioId);
    if (!servicio) {
      const error = new Error(`El servicio con ID '${turnoData.servicioId}' no existe`);
      error.statusCode = 400;
      throw error;
    }

    const nuevoTurno = await Turno.create(turnoData);

    // Retornar el turno poblado con sus referencias completas
    return await Turno.findById(nuevoTurno._id)
      .populate('pacienteId', 'nombre email telNumber fechaNacimiento genero')
      .populate('servicioId', 'nombre descripcion duracionMinutos precio activo');
  }

  /**
   * Crear turno directamente desde el formulario de contacto público del Frontend
   * Si el usuario no existe por email, lo crea automáticamente como paciente
   */
  async createFromContactForm(formData) {
    const { nombre, email, telNumber, date, genero, motivoConsulta, comentarios, servicioId } = formData;

    if (!nombre || !email || !motivoConsulta) {
      const error = new Error('Nombre, email y motivo de consulta son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    // 1. Buscar o registrar al paciente
    let paciente = await User.findOne({ email: email.toLowerCase().trim() });
    if (!paciente) {
      paciente = await User.create({
        nombre,
        email: email.toLowerCase().trim(),
        password: 'TempPassword123!', // Contraseña provisoria para nuevo paciente
        telNumber: telNumber || '',
        fechaNacimiento: date ? new Date(date) : null,
        genero: genero || '',
        rol: 'paciente',
      });
    }

    // 2. Determinar el servicio (si no se especifica, toma el primero activo)
    let servicioTargetId = servicioId;
    if (!servicioTargetId) {
      const primerServicio = await Service.findOne({ activo: true });
      if (primerServicio) {
        servicioTargetId = primerServicio._id;
      } else {
        // Servicio por defecto si la base estuviera vacía
        const servicioDefault = await Service.create({
          nombre: 'Consulta Psicopedagógica Inicial',
          descripcion: 'Entrevista de admisión y evaluación diagnóstica',
          duracionMinutos: 45,
          precio: 8500,
          activo: true,
        });
        servicioTargetId = servicioDefault._id;
      }
    }

    // 3. Crear el turno
    const nuevoTurno = await Turno.create({
      pacienteId: paciente._id,
      servicioId: servicioTargetId,
      fechaHora: new Date(Date.now() + 24 * 60 * 60 * 1000), // Fecha tentativa en 24h
      estado: 'pendiente',
      motivoConsulta,
      comentarios: comentarios || '',
    });

    return await Turno.findById(nuevoTurno._id)
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio');
  }

  /**
   * Actualizar turno por ID
   */
  async update(id, updateData) {
    const turno = await Turno.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio');

    if (!turno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return turno;
  }

  /**
   * Eliminar turno por ID
   */
  async delete(id) {
    const turno = await Turno.findByIdAndDelete(id);
    if (!turno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Turno eliminado exitosamente', id };
  }
}

module.exports = new TurnoService();

