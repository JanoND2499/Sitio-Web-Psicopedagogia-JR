const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

class ProductService {
  /**
   * Obtener todos los productos con populate de su Categoría
   */
  async getAll(query = {}) {
    const filter = {};
    if (query.categoria) {
      if (!mongoose.Types.ObjectId.isValid(query.categoria)) {
        const error = new Error(`El formato del ID de categoría '${query.categoria}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      filter.categoria = query.categoria;
    }
    if (query.search) {
      filter.nombre = { $regex: query.search, $options: 'i' };
    }

    return await Product.find(filter)
      .populate('categoria', 'nombre descripcion')
      .sort({ createdAt: -1 });
  }

  /**
   * Obtener un producto por ID con su categoría poblada
   */
  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(id).populate('categoria', 'nombre descripcion');
    if (!product) {
      const error = new Error(`Producto con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  /**
   * Crear un nuevo producto
   */
  async create(productData) {
    if (!productData.nombre || productData.precio === undefined || !productData.categoria) {
      const error = new Error('nombre, precio y categoria son campos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(productData.categoria)) {
      const error = new Error(`El formato del ID de categoría '${productData.categoria}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    // Validar que la categoría exista
    const categoryExists = await Category.findById(productData.categoria);
    if (!categoryExists) {
      const error = new Error(`La categoría con id '${productData.categoria}' no existe`);
      error.statusCode = 404;
      throw error;
    }

    const newProduct = await Product.create(productData);
    return await Product.findById(newProduct._id).populate('categoria', 'nombre descripcion');
  }

  /**
   * Actualizar un producto
   */
  async update(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (updateData.categoria) {
      if (!mongoose.Types.ObjectId.isValid(updateData.categoria)) {
        const error = new Error(`El formato del ID de categoría '${updateData.categoria}' no es válido`);
        error.statusCode = 400;
        throw error;
      }
      const categoryExists = await Category.findById(updateData.categoria);
      if (!categoryExists) {
        const error = new Error(`La categoría con id '${updateData.categoria}' no existe`);
        error.statusCode = 404;
        throw error;
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('categoria', 'nombre descripcion');

    if (!product) {
      const error = new Error(`Producto con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  /**
   * Eliminar un producto
   */
  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      const error = new Error(`Producto con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Producto eliminado exitosamente', id };
  }
}

module.exports = new ProductService();
