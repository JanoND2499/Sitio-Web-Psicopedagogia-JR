const turnoService = require('../services/turnoService');

class TurnoController {
  async getAll(req, res) {
    try {
      const turnos = await turnoService.getAll(req.query);
      return res.status(200).json({
        success: true,
        count: turnos.length,
        data: turnos,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener los turnos',
      });
    }
  }

  async getById(req, res) {
    try {
      const turno = await turnoService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: turno,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener el turno',
      });
    }
  }

  async create(req, res) {
    try {
      const newTurno = await turnoService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Turno creado exitosamente',
        data: newTurno,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al crear el turno',
      });
    }
  }

  /**
   * Endpoint público para recibir reservas desde el formulario de contacto del Frontend
   */
  async createFromContact(req, res) {
    try {
      const turno = await turnoService.createFromContactForm(req.body);
      return res.status(201).json({
        success: true,
        message: 'Solicitud de turno enviada y registrada con éxito',
        data: turno,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al procesar la solicitud de turno',
      });
    }
  }

  async update(req, res) {
    try {
      const updatedTurno = await turnoService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Turno actualizado exitosamente',
        data: updatedTurno,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar el turno',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await turnoService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar el turno',
      });
    }
  }
}

module.exports = new TurnoController();

