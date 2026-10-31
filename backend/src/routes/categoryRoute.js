const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/verifyToken');

// Rutas públicas de lectura
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Rutas protegidas por JWT
router.post('/', verifyToken, categoryController.create);
router.put('/:id', verifyToken, categoryController.update);
router.delete('/:id', verifyToken, categoryController.delete);

module.exports = router;

