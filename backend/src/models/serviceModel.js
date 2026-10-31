const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción del servicio es obligatoria'],
      trim: true,
    },
    duracionMinutos: {
      type: Number,
      required: [true, 'La duración en minutos es obligatoria'],
      min: [5, 'La duración mínima debe ser de al menos 5 minutos'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;

