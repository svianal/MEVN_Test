const express = require('express');
const router = express.Router();

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  checkConflicts
} = require('../controllers/appointmentController');

// Crear cita
router.post('/appointments', createAppointment);

// Listar todas
router.get('/appointments', getAppointments);

// Obtener por id
router.get('/appointments/:id', getAppointmentById);

// actualizar
router.put('/appointments/:id', updateAppointment);

// eliminar
router.delete('/appointments/:id', deleteAppointment);

router.get('/appointments/conflicts/check', checkConflicts);

module.exports = router;
