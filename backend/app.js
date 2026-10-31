const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validación de variables de entorno críticas y obligatorias
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`[Error Fatal de Configuración] Faltan variables de entorno obligatorias: ${missingVars.join(', ')}`);
  console.error('Por favor configure estas variables en su archivo .env antes de iniciar la aplicación.');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

// Importación de rutas
const userRoute = require('./src/routes/userRoute');
const serviceRoute = require('./src/routes/serviceRoute');
const turnoRoute = require('./src/routes/turnoRoute');
const productRoute = require('./src/routes/productRoute');
const categoryRoute = require('./src/routes/categoryRoute');

const app = express();

// Conexión a la base de datos MongoDB (solo si no hay una conexión activa previa)
if (mongoose.connection.readyState === 0) {
  connectDB();
}

// Middlewares globales
app.use(cors()); // Habilita CORS para permitir peticiones del cliente React
app.use(express.json()); // Permite recibir y procesar payloads JSON
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // Registro de peticiones HTTP en consola
}

// Ruta informativa de estado en la raíz
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'API RESTful - En-Joy Psicopedagogía & UTN Backend Final',
    version: '1.0.0',
    documentation: 'Consulte /api para conocer las rutas disponibles o el README.md',
    endpoints: {
      auth_y_usuarios: '/api/usuarios (/register, /login)',
      servicios: '/api/servicios (CRUD)',
      turnos: '/api/turnos (CRUD con populate y /solicitar)',
      productos: '/api/productos (CRUD con populate de categoría)',
      categorias: '/api/categorias (CRUD)',
    },
  });
});

// Montaje de rutas de la API
app.use('/api/usuarios', userRoute);
app.use('/api/users', userRoute); // Alias en inglés

app.use('/api/servicios', serviceRoute);
app.use('/api/services', serviceRoute); // Alias en inglés

app.use('/api/turnos', turnoRoute);

app.use('/api/productos', productRoute);
app.use('/api/products', productRoute); // Alias en inglés

app.use('/api/categorias', categoryRoute);
app.use('/api/categories', categoryRoute); // Alias en inglés

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware centralizado para el manejo global de errores (500)
app.use((err, req, res, _next) => {
  console.error('[Error no controlado]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Puerto de escucha
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Servidor API RESTful corriendo en puerto ${PORT}`);
    console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(` URL Base: http://localhost:${PORT}`);
    console.log(` Documentación de rutas: http://localhost:${PORT}/`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
