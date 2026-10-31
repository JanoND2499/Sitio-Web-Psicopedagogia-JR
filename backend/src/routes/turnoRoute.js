const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');

// Endpoint público para el formulario de admisión de la web
router.post('/solicitar', turnoController.createFromContact);

// Rutas de consulta protegidas por JWT
// - Paciente: consulta exclusivamente sus propios turnos
// - Admin: consulta y filtra todos los turnos del consultorio
router.get('/', verifyToken, turnoController.getAll);
router.get('/:id', verifyToken, turnoController.getById);

// Operación específica y limitada: cancelación de turno propio por parte del paciente (o admin)
router.patch('/:id/cancelar', verifyToken, turnoController.cancelar);

// Rutas de administración exclusiva de turnos (crear formalmente, modificar y eliminar requieren rol admin)
router.post('/', verifyToken, verifyAdmin, turnoController.create);
router.put('/:id', verifyToken, verifyAdmin, turnoController.update);
router.delete('/:id', verifyToken, verifyAdmin, turnoController.delete);

module.exports = router;
