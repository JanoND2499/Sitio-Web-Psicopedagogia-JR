const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const result = await userService.register(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al registrar el usuario',
      });
    }
  }

  async login(req, res) {
    try {
      const result = await userService.login(req.body);
      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 401).json({
        success: false,
        message: error.message || 'Error al iniciar sesión',
      });
    }
  }

  async getAll(req, res) {
    try {
      const users = await userService.getAll();
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener los usuarios',
      });
    }
  }

  async getById(req, res) {
    try {
      const user = await userService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener el usuario',
      });
    }
  }

  async update(req, res) {
    try {
      const updatedUser = await userService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar el usuario',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await userService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar el usuario',
      });
    }
  }
}

module.exports = new UserController();

