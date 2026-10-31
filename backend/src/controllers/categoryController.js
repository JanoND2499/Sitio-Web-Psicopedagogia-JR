const categoryService = require('../services/categoryService');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAll();
      return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener las categorías',
      });
    }
  }

  async getById(req, res) {
    try {
      const category = await categoryService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener la categoría',
      });
    }
  }

  async create(req, res) {
    try {
      const newCategory = await categoryService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: newCategory,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al crear la categoría',
      });
    }
  }

  async update(req, res) {
    try {
      const updatedCategory = await categoryService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: updatedCategory,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar la categoría',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await categoryService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar la categoría',
      });
    }
  }
}

module.exports = new CategoryController();

