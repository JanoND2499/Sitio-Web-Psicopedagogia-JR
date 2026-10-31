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

