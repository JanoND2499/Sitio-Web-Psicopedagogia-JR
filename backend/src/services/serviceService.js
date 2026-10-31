const mongoose = require('mongoose');
const Service = require('../models/serviceModel');

class ServiceService {
  /**
   * Obtener todos los servicios con soporte para filtros
   */
  async getAll(query = {}) {
    const filter = {};
    if (query.activo !== undefined) {
      filter.activo = query.activo === 'true' || query.activo === true;
    }
    if (query.search) {
      filter.nombre = { $regex: query.search, $options: 'i' };
    }
    return await Service.find(filter).sort({ nombre: 1 });
  }

  /**
   * Obtener un servicio por ID
   */
  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const service = await Service.findById(id);
    if (!service) {
      const error = new Error(`Servicio con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return service;
  }

  /**
   * Crear un nuevo servicio
   */
  async create(serviceData) {
    return await Service.create(serviceData);
  }

  /**
   * Actualizar un servicio por ID
   */
  async update(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const service = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      const error = new Error(`Servicio con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return service;
  }

  /**
   * Eliminar un servicio por ID
   */
  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      const error = new Error(`Servicio con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Servicio eliminado exitosamente', id };
  }
}

module.exports = new ServiceService();
