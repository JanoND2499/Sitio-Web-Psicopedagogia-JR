const Category = require('../models/categoryModel');

class CategoryService {
  async getAll() {
    return await Category.find().sort({ nombre: 1 });
  }

  async getById(id) {
    const category = await Category.findById(id);
    if (!category) {
      const error = new Error(`Categoría con id '${id}' no encontrada`);
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  async create(categoryData) {
    return await Category.create(categoryData);
  }

  async update(id, updateData) {
    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      const error = new Error(`Categoría con id '${id}' no encontrada`);
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  async delete(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      const error = new Error(`Categoría con id '${id}' no encontrada`);
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Categoría eliminada exitosamente', id };
  }
}

module.exports = new CategoryService();

