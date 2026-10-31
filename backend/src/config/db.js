const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/enjoy_psicopedagogia';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host} / BD: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Error al conectar a la base de datos: ${error.message}`);
    // En desarrollo permitimos que el servidor siga corriendo si Mongo aún no se ha iniciado
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
