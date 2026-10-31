const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');

// Rutas públicas de lectura
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Rutas protegidas por JWT (exclusivas rol admin)
router.post('/', verifyToken, verifyAdmin, productController.create);
router.put('/:id', verifyToken, verifyAdmin, productController.update);
router.delete('/:id', verifyToken, verifyAdmin, productController.delete);

module.exports = router;
