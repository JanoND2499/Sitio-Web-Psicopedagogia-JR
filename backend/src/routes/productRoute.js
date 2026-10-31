const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/verifyToken');

// Rutas públicas de lectura
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Rutas protegidas por JWT (Creación, Actualización y Eliminación)
router.post('/', verifyToken, productController.create);
router.put('/:id', verifyToken, productController.update);
router.delete('/:id', verifyToken, productController.delete);

module.exports = router;

