const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const { verifyToken } = require('../middleware/verifyToken');

// Endpoint público para el formulario de contacto de la web
router.post('/solicitar', turnoController.createFromContact);

// Rutas de administración y gestión de turnos protegidas por JWT
router.get('/', verifyToken, turnoController.getAll);
router.get('/:id', verifyToken, turnoController.getById);
router.post('/', verifyToken, turnoController.create);
router.put('/:id', verifyToken, turnoController.update);
router.delete('/:id', verifyToken, turnoController.delete);

module.exports = router;

