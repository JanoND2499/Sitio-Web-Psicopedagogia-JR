const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'La referencia al paciente (Usuario) es obligatoria'],
      index: true,
    },
    servicioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'La referencia al servicio es obligatoria'],
    },
    fechaHora: {
      type: Date,
      required: [true, 'La fecha y hora del turno es obligatoria'],
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'cancelado'],
      default: 'pendiente',
    },
    motivoConsulta: {
      type: String,
      required: [true, 'El motivo de la consulta es obligatorio'],
      trim: true,
    },
    comentarios: {
      type: String,
      trim: true,
      default: '',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto recomendado en EVALUACION_DISENO_DB.md para optimizar consultas de agenda
turnoSchema.index({ fechaHora: 1, estado: 1 });

const Turno = mongoose.model('Turno', turnoSchema);
module.exports = Turno;

