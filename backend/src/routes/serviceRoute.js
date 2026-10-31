const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');

// Rutas de lectura públicas
router.get('/', serviceController.getAll);
router.get('/:id', serviceController.getById);

// Rutas administrativas protegidas por JWT (exclusivas rol admin)
router.post('/', verifyToken, verifyAdmin, serviceController.create);
router.put('/:id', verifyToken, verifyAdmin, serviceController.update);
router.delete('/:id', verifyToken, verifyAdmin, serviceController.delete);

module.exports = router;
