const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');

// Rutas públicas de lectura
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Rutas protegidas por JWT (exclusivas rol admin)
router.post('/', verifyToken, verifyAdmin, categoryController.create);
router.put('/:id', verifyToken, verifyAdmin, categoryController.update);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.delete);

module.exports = router;
