const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verifyToken } = require('../middleware/verifyToken');

// Rutas de lectura públicas
router.get('/', serviceController.getAll);
router.get('/:id', serviceController.getById);

// Rutas sensibles protegidas por JWT (Creación, Actualización y Eliminación)
router.post('/', verifyToken, serviceController.create);
router.put('/:id', verifyToken, serviceController.update);
router.delete('/:id', verifyToken, serviceController.delete);

module.exports = router;

