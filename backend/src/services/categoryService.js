const mongoose = require('mongoose');
const Category = require('../models/categoryModel');

class CategoryService {
  async getAll() {
    return await Category.find().sort({ nombre: 1 });
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const category = await Category.findById(id);
    if (!category) {
      const error = new Error(`Categoría con id '${id}' no encontrada`);
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  async create(categoryData) {
    if (!categoryData.nombre) {
      const error = new Error('El nombre de la categoría es obligatorio');
      error.statusCode = 400;
      throw error;
    }

    const existingCategory = await Category.findOne({ nombre: categoryData.nombre.trim() });
    if (existingCategory) {
      const error = new Error(`Ya existe una categoría con el nombre '${categoryData.nombre}'`);
      error.statusCode = 400;
      throw error;
    }

    return await Category.create(categoryData);
  }

  async update(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

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
