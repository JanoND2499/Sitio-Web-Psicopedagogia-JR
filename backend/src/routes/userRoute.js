const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');

// Rutas públicas de autenticación
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rutas protegidas por JWT
router.get('/', verifyToken, userController.getAll);
router.get('/:id', verifyToken, userController.getById);
router.put('/:id', verifyToken, userController.update);
router.delete('/:id', verifyToken, verifyAdmin, userController.delete);

module.exports = router;

