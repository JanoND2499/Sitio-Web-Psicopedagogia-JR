const productService = require('../services/productService');

class ProductController {
  async getAll(req, res) {
    try {
      const products = await productService.getAll(req.query);
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener los productos',
      });
    }
  }

  async getById(req, res) {
    try {
      const product = await productService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al obtener el producto',
      });
    }
  }

  async create(req, res) {
    try {
      const newProduct = await productService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: newProduct,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Error al crear el producto',
      });
    }
  }

  async update(req, res) {
    try {
      const updatedProduct = await productService.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al actualizar el producto',
      });
    }
  }

  async delete(req, res) {
    try {
      const result = await productService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error al eliminar el producto',
      });
    }
  }
}

module.exports = new ProductController();

