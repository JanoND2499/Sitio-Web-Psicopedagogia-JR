const turnoService = require('../services/turnoService');

class TurnoController {
  async getAll(req, res) {
    try {
      const turnos = await turnoService.getAll(req.query, req.user);
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
      const turno = await turnoService.getById(req.params.id, req.user);
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
      const newTurno = await turnoService.create(req.body, req.user);
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
   * Endpoint público para recibir solicitudes desde el formulario de contacto del Frontend
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
      const updatedTurno = await turnoService.update(req.params.id, req.body, req.user);
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

  async cancelar(req, res) {
    try {
      const turnoCancelado = await turnoService.cancelar(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Turno cancelado exitosamente',
        data: turnoCancelado,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al cancelar el turno',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await turnoService.delete(req.params.id, req.user);
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
