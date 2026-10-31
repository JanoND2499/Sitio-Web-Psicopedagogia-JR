const crypto = require('crypto');
const mongoose = require('mongoose');
const Turno = require('../models/turnoModel');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');

class TurnoService {
  /**
   * Obtener todos los turnos con filtros opcionales y control estricto de roles
   * - Admin: puede consultar y filtrar todos los turnos del consultorio.
   * - Paciente: consulta exclusivamente sus propios turnos.
   * - Rol desconocido o inválido: recibe HTTP 403.
   */
  async getAll(filters = {}, currentUser = null) {
    if (!currentUser) {
      const error = new Error('Acceso denegado: Se requiere un usuario autenticado');
      error.statusCode = 403;
      throw error;
    }

    if (currentUser.rol !== 'admin' && currentUser.rol !== 'paciente') {
      const error = new Error('Acceso denegado: Rol de usuario no reconocido o inválido');
      error.statusCode = 403;
      throw error;
    }

    const query = {};

    if (currentUser.rol === 'paciente') {
      const pacienteId = currentUser.id || currentUser._id;
      if (!pacienteId || !mongoose.Types.ObjectId.isValid(pacienteId)) {
        const error = new Error('Acceso denegado: Identificador de paciente no válido o ausente');
        error.statusCode = 403;
        throw error;
      }
      // Un paciente solo puede consultar sus propios turnos
      query.pacienteId = pacienteId;
    } else if (filters.pacienteId) {
      if (!mongoose.Types.ObjectId.isValid(filters.pacienteId)) {
        const error = new Error(`El formato del pacienteId '${filters.pacienteId}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      query.pacienteId = filters.pacienteId;
    }

    if (filters.servicioId) {
      if (!mongoose.Types.ObjectId.isValid(filters.servicioId)) {
        const error = new Error(`El formato del servicioId '${filters.servicioId}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      query.servicioId = filters.servicioId;
    }

    if (filters.estado) {
      query.estado = filters.estado;
    }

    return await Turno.find(query)
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio')
      .sort({ fechaHora: 1 });
  }

  /**
   * Obtener un turno por su ID con control estricto de pertenencia y roles
   * - Admin: puede consultar cualquier turno.
   * - Paciente: solo puede consultar su propio turno (403 ante turnos ajenos).
   * - Rol desconocido o inválido: recibe HTTP 403.
   */
  async getById(id, currentUser = null) {
    if (!currentUser) {
      const error = new Error('Acceso denegado: Se requiere un usuario autenticado');
      error.statusCode = 403;
      throw error;
    }

    if (currentUser.rol !== 'admin' && currentUser.rol !== 'paciente') {
      const error = new Error('Acceso denegado: Rol de usuario no reconocido o inválido');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const turno = await Turno.findById(id)
      .populate('pacienteId', 'nombre email telNumber fechaNacimiento genero')
      .populate('servicioId', 'nombre descripcion duracionMinutos precio activo');

    if (!turno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    if (currentUser.rol === 'paciente') {
      const pacienteId = currentUser.id || currentUser._id;
      if (!pacienteId || !mongoose.Types.ObjectId.isValid(pacienteId)) {
        const error = new Error('Acceso denegado: Identificador de paciente no válido o ausente');
        error.statusCode = 403;
        throw error;
      }
      const ownerId = turno.pacienteId?._id ? turno.pacienteId._id.toString() : turno.pacienteId.toString();
      if (ownerId !== String(pacienteId)) {
        const error = new Error('Acceso denegado: No tiene permisos para consultar turnos de otros pacientes');
        error.statusCode = 403;
        throw error;
      }
    }

    return turno;
  }

  /**
   * Crear un nuevo turno formal en el consultorio (Exclusivo Administrador)
   */
  async create(turnoData, currentUser = null) {
    if (!currentUser || currentUser.rol !== 'admin') {
      const error = new Error('Acceso denegado: Se requieren permisos de Administrador para agendar turnos');
      error.statusCode = 403;
      throw error;
    }

    if (!turnoData.pacienteId || !turnoData.servicioId || !turnoData.fechaHora || !turnoData.motivoConsulta) {
      const error = new Error('pacienteId, servicioId, fechaHora y motivoConsulta son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(turnoData.pacienteId)) {
      const error = new Error(`El formato del ID de paciente '${turnoData.pacienteId}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(turnoData.servicioId)) {
      const error = new Error(`El formato del ID de servicio '${turnoData.servicioId}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const paciente = await User.findById(turnoData.pacienteId);
    if (!paciente) {
      const error = new Error(`El paciente con ID '${turnoData.pacienteId}' no existe`);
      error.statusCode = 404;
      throw error;
    }

    const servicio = await Service.findById(turnoData.servicioId);
    if (!servicio) {
      const error = new Error(`El servicio con ID '${turnoData.servicioId}' no existe`);
      error.statusCode = 404;
      throw error;
    }

    const nuevoTurno = await Turno.create(turnoData);

    return await Turno.findById(nuevoTurno._id)
      .populate('pacienteId', 'nombre email telNumber fechaNacimiento genero')
      .populate('servicioId', 'nombre descripcion duracionMinutos precio activo');
  }

  /**
   * Crear solicitud de turno desde el formulario de contacto público del Frontend
   * - No inventa fechas de atención artificiales (fechaHora: null).
   * - Crea la solicitud en estado 'pendiente' para coordinación posterior con la psicopedagoga.
   * - Conserva la fecha enviada como fecha de nacimiento del paciente.
   */
  async createFromContactForm(formData) {
    const { nombre, email, telNumber, date, genero, motivoConsulta, comentarios, servicioId } = formData;

    if (!nombre || !email || !motivoConsulta) {
      const error = new Error('Nombre, email y motivo de consulta son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    // 1. Buscar o registrar al paciente con clave aleatoria segura
    let paciente = await User.findOne({ email: email.toLowerCase().trim() });
    if (!paciente) {
      const unguessablePassword = crypto.randomBytes(32).toString('hex');
      paciente = await User.create({
        nombre,
        email: email.toLowerCase().trim(),
        password: unguessablePassword,
        telNumber: telNumber || '',
        fechaNacimiento: date ? new Date(date) : null,
        genero: genero || '',
        rol: 'paciente',
      });
    }

    // 2. Determinar el servicio
    let servicioTargetId = servicioId;
    if (servicioTargetId && !mongoose.Types.ObjectId.isValid(servicioTargetId)) {
      const error = new Error(`El formato del servicioId '${servicioTargetId}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (!servicioTargetId) {
      const primerServicio = await Service.findOne({ activo: true });
      if (primerServicio) {
        servicioTargetId = primerServicio._id;
      } else {
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

    // 3. Crear solicitud de turno en estado 'pendiente' sin inventar fecha de atención
    const nuevoTurno = await Turno.create({
      pacienteId: paciente._id,
      servicioId: servicioTargetId,
      fechaHora: null,
      estado: 'pendiente',
      motivoConsulta,
      comentarios: comentarios || 'Solicitud web pendiente de coordinación de horario',
    });

    return await Turno.findById(nuevoTurno._id)
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio');
  }

  /**
   * Actualizar turno por ID con lista blanca estricta y validación de relaciones (Exclusivo Administrador)
   */
  async update(id, updateData, currentUser = null) {
    if (!currentUser || currentUser.rol !== 'admin') {
      const error = new Error('Acceso denegado: Se requieren permisos de Administrador para modificar turnos');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
      const error = new Error('Los datos de actualización deben ser un objeto válido');
      error.statusCode = 400;
      throw error;
    }

    // 1. Detección y rechazo de operadores de MongoDB (como $set, $unset, etc.)
    for (const key of Object.keys(updateData)) {
      if (key.startsWith('$')) {
        const error = new Error(`Operador de MongoDB no permitido: '${key}'`);
        error.statusCode = 400;
        throw error;
      }
    }

    // 2. Lista blanca estricta de campos modificables
    const ALLOWED_FIELDS = ['pacienteId', 'servicioId', 'fechaHora', 'estado', 'motivoConsulta', 'comentarios'];
    const sanitizedData = {};
    for (const field of ALLOWED_FIELDS) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      const error = new Error('No se enviaron campos válidos para actualizar');
      error.statusCode = 400;
      throw error;
    }

    // 3. Validación de valores específicos
    if (sanitizedData.estado !== undefined) {
      const validStates = ['pendiente', 'confirmado', 'cancelado'];
      if (!validStates.includes(sanitizedData.estado)) {
        const error = new Error(`El estado '${sanitizedData.estado}' no es válido. Valores permitidos: ${validStates.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    }

    if (sanitizedData.fechaHora !== undefined && sanitizedData.fechaHora !== null) {
      const parsedDate = new Date(sanitizedData.fechaHora);
      if (isNaN(parsedDate.getTime())) {
        const error = new Error('La fecha y hora del turno debe ser una fecha válida');
        error.statusCode = 400;
        throw error;
      }
      sanitizedData.fechaHora = parsedDate;
    }

    const existingTurno = await Turno.findById(id);
    if (!existingTurno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    // 4. Validación de referencias relacionales
    if (sanitizedData.pacienteId) {
      if (!mongoose.Types.ObjectId.isValid(sanitizedData.pacienteId)) {
        const error = new Error(`El formato del ID de paciente '${sanitizedData.pacienteId}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      const pacienteExists = await User.findById(sanitizedData.pacienteId);
      if (!pacienteExists) {
        const error = new Error(`El paciente con ID '${sanitizedData.pacienteId}' no existe`);
        error.statusCode = 404;
        throw error;
      }
    }

    if (sanitizedData.servicioId) {
      if (!mongoose.Types.ObjectId.isValid(sanitizedData.servicioId)) {
        const error = new Error(`El formato del ID de servicio '${sanitizedData.servicioId}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      const servicioExists = await Service.findById(sanitizedData.servicioId);
      if (!servicioExists) {
        const error = new Error(`El servicio con ID '${sanitizedData.servicioId}' no existe`);
        error.statusCode = 404;
        throw error;
      }
    }

    const turno = await Turno.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    })
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio');

    return turno;
  }

  /**
   * Operación específica y limitada: cancelar un turno (paciente propietario o admin)
   * REGLAS DE NEGOCIO:
   * - Solo admin o paciente propietario pueden cancelar (roles inválidos reciben 403).
   * - Un turno ya cancelado no puede volver a cancelarse (HTTP 400).
   * - Un turno cuya fecha ya ha transcurrido ("ya realizado") no puede cancelarse (HTTP 400).
   * - Un turno confirmado no puede cancelarse directamente por el paciente en la web (requiere coordinación clínica o admin) (HTTP 400).
   */
  async cancelar(id, currentUser = null) {
    if (!currentUser) {
      const error = new Error('Acceso denegado: Se requiere un usuario autenticado');
      error.statusCode = 403;
      throw error;
    }

    if (currentUser.rol !== 'admin' && currentUser.rol !== 'paciente') {
      const error = new Error('Acceso denegado: Rol de usuario no reconocido o inválido');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const turno = await Turno.findById(id);
    if (!turno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    if (currentUser.rol === 'paciente') {
      const pacienteId = currentUser.id || currentUser._id;
      if (!pacienteId || !mongoose.Types.ObjectId.isValid(pacienteId)) {
        const error = new Error('Acceso denegado: Identificador de paciente no válido o ausente');
        error.statusCode = 403;
        throw error;
      }
      const ownerId = turno.pacienteId ? turno.pacienteId.toString() : '';
      if (ownerId !== String(pacienteId)) {
        const error = new Error('Acceso denegado: No tiene permisos para cancelar turnos de otros pacientes');
        error.statusCode = 403;
        throw error;
      }
    }

    // Regla 1: Un turno ya cancelado no puede volver a cancelarse
    if (turno.estado === 'cancelado') {
      const error = new Error('El turno ya se encuentra cancelado');
      error.statusCode = 400;
      throw error;
    }

    // Regla 2: Un turno cuya fecha ya ha transcurrido no puede cancelarse
    if (turno.fechaHora && new Date(turno.fechaHora).getTime() < Date.now()) {
      const error = new Error('No es posible cancelar un turno cuya fecha y hora ya han transcurrido');
      error.statusCode = 400;
      throw error;
    }

    // Regla 3: Un turno confirmado no puede ser cancelado directamente por el paciente en línea
    if (currentUser.rol === 'paciente' && turno.estado === 'confirmado') {
      const error = new Error('Los turnos confirmados no pueden cancelarse directamente por el paciente. Por favor comuníquese con el consultorio.');
      error.statusCode = 400;
      throw error;
    }

    turno.estado = 'cancelado';
    await turno.save();

    return await Turno.findById(id)
      .populate('pacienteId', 'nombre email telNumber')
      .populate('servicioId', 'nombre duracionMinutos precio');
  }

  /**
   * Eliminar turno con control exclusivo de administrador
   */
  async delete(id, currentUser = null) {
    if (!currentUser || currentUser.rol !== 'admin') {
      const error = new Error('Acceso denegado: Se requieren permisos de Administrador para eliminar turnos');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const existingTurno = await Turno.findById(id);
    if (!existingTurno) {
      const error = new Error(`Turno con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    await Turno.findByIdAndDelete(id);
    return {
      message: 'Turno eliminado exitosamente',
      id,
    };
  }
}

module.exports = new TurnoService();
