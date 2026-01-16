const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    doctorName: {
      type: String,
      required: true,
      trim: true
    },
date: {
  type: String,
  required: true, // formato "YYYY-MM-DD"
  match: /^\d{4}-\d{2}-\d{2}$/ // opcional: asegura formato válido
}
,
    startTime: {
      type: String, // "HH:mm"
      required: true
    },
    endTime: {
      type: String, // "HH:mm"
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
