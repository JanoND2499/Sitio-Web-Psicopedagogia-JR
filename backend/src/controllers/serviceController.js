const serviceService = require('../services/serviceService');

class ServiceController {
  async getAll(req, res) {
    try {
      const services = await serviceService.getAll(req.query);
      return res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener los servicios',
      });
    }
  }

  async getById(req, res) {
    try {
      const service = await serviceService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener el servicio',
      });
    }
  }

  async create(req, res) {
    try {
      const newService = await serviceService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: newService,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al crear el servicio',
      });
    }
  }

  async update(req, res) {
    try {
      const updatedService = await serviceService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: updatedService,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar el servicio',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await serviceService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar el servicio',
      });
    }
  }
}

module.exports = new ServiceController();

