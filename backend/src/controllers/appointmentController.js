const Appointment = require('../models/Appointment');
const { timeToMinutes } = require('../utils/time');
const mongoose = require('mongoose');

// Crear cita
exports.createAppointment = async (req, res) => {
  try {
    const {
      patientName,
      doctorName,
      date,       // string "YYYY-MM-DD"
      startTime,
      endTime,
      reason
    } = req.body;

    // Validar horas
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Validar fecha (no pasada)
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (date < todayStr) {
      return res.status(400).json({
        message: 'La fecha de la cita no puede ser anterior a hoy'
      });
    }

    // Buscar solapamientos
    const existingAppointments = await Appointment.find({
      doctorName,
      date,              // comparar string directamente
      status: 'scheduled'
    });

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    const conflicts = existingAppointments.filter(app => {
      const existingStart = timeToMinutes(app.startTime);
      const existingEnd = timeToMinutes(app.endTime);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Existe solapamiento con otras citas',
        conflicts
      });
    }

    // Crear cita
    const appointment = await Appointment.create({
      patientName,
      doctorName,
      date,          // guardar como string
      startTime,
      endTime,
      reason
    });

    return res.status(201).json(appointment);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};

// Obtener citas
exports.getAppointments = async (req, res) => {
  try {
    const { date, doctorName, status } = req.query;

    const filters = {};

    if (doctorName) filters.doctorName = doctorName;
    if (status) filters.status = status;

    if (date) {
      filters.date = date; // comparar string directamente
    }

    const appointments = await Appointment.find(filters).sort({
      date: 1,
      startTime: 1
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener las citas'
    });
  }
};

// Obtener cita por ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de cita inválido' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.status(200).json(appointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la cita' });
  }
};

// Actualizar cita
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      doctorName,
      date,
      startTime,
      endTime,
      reason,
      status
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de cita inválido' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Cita no encontrada' });

    // Validar horas
    if (startTime && endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Validar fecha
    if (date) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (date < todayStr) {
        return res.status(400).json({
          message: 'La fecha no puede ser anterior a hoy'
        });
      }
    }

    // Detectar solapamientos (excluyendo la cita actual)
    if (doctorName || date || startTime || endTime) {
      const checkDoctor = doctorName || appointment.doctorName;
      const checkDate = date || appointment.date; // string
      const checkStart = startTime || appointment.startTime;
      const checkEnd = endTime || appointment.endTime;

      const overlappingAppointments = await Appointment.find({
        _id: { $ne: id },
        doctorName: checkDoctor,
        date: checkDate,
        status: { $ne: 'cancelled' },
        $or: [
          { startTime: { $lt: checkEnd }, endTime: { $gt: checkStart } }
        ]
      });

      if (overlappingAppointments.length > 0) {
        return res.status(409).json({
          message: 'La cita se solapa con otra existente',
          conflicts: overlappingAppointments
        });
      }
    }

    // Actualizar campos
    appointment.patientName = patientName ?? appointment.patientName;
    appointment.doctorName = doctorName ?? appointment.doctorName;
    appointment.date = date ?? appointment.date;          // string
    appointment.startTime = startTime ?? appointment.startTime;
    appointment.endTime = endTime ?? appointment.endTime;
    appointment.reason = reason ?? appointment.reason;
    appointment.status = status ?? appointment.status;

    await appointment.save();

    res.status(200).json(appointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la cita' });
  }
};

// Eliminar cita
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de cita inválido' });
    }

    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) return res.status(404).json({ message: 'Cita no encontrada' });

    res.status(200).json({ message: 'Cita eliminada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la cita' });
  }
};

// Verificar conflictos
exports.checkConflicts = async (req, res) => {
  try {
    const { doctorName, date, startTime, endTime, excludeId } = req.query;

    if (!doctorName || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Faltan parámetros requeridos' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'La hora de fin debe ser posterior a la hora de inicio' });
    }

    const query = {
      doctorName,
      date,       // string
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    };

    if (excludeId) {
      if (!mongoose.Types.ObjectId.isValid(excludeId)) {
        return res.status(400).json({ message: 'excludeId inválido' });
      }
      query._id = { $ne: excludeId };
    }

    const conflicts = await Appointment.find(query).sort({ startTime: 1 });

    res.status(200).json(conflicts);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar conflictos' });
  }
};
