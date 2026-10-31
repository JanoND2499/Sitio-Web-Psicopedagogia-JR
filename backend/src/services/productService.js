const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

class ProductService {
  /**
   * Obtener todos los productos con populate de su Categoría
   */
  async getAll(query = {}) {
    const filter = {};
    if (query.categoria) {
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
    // Validar que la categoría exista
    const categoryExists = await Category.findById(productData.categoria);
    if (!categoryExists) {
      const error = new Error(`La categoría con id '${productData.categoria}' no existe`);
      error.statusCode = 400;
      throw error;
    }

    const newProduct = await Product.create(productData);
    return await Product.findById(newProduct._id).populate('categoria', 'nombre descripcion');
  }

  /**
   * Actualizar un producto
   */
  async update(id, updateData) {
    if (updateData.categoria) {
      const categoryExists = await Category.findById(updateData.categoria);
      if (!categoryExists) {
        const error = new Error(`La categoría con id '${updateData.categoria}' no existe`);
        error.statusCode = 400;
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

