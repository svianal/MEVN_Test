const Appointment = require('../models/Appointment');
const { timeToMinutes } = require('../utils/time');
const mongoose = require('mongoose');

exports.createAppointment = async (req, res) => {
  try {
    const {
      patientName,
      doctorName,
      date,
      startTime,
      endTime,
      reason
    } = req.body;

    // 1️⃣ Validar horas
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({
        message: 'endTime debe ser posterior a startTime'
      });
    }

    // 2️⃣ Validar fecha (no pasada)
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({
        message: 'La fecha de la cita no puede ser anterior a hoy'
      });
    }

    // 3️⃣ Buscar solapamientos
    const existingAppointments = await Appointment.find({
      doctorName,
      date: appointmentDate,
      status: 'scheduled'
    });

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    const conflicts = existingAppointments.filter(app => {
      const existingStart = timeToMinutes(app.startTime);
      const existingEnd = timeToMinutes(app.endTime);

      // Condición clásica de solapamiento
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Existe solapamiento con otras citas',
        conflicts
      });
    }

    // 4️⃣ Crear cita
    const appointment = await Appointment.create({
      patientName,
      doctorName,
      date: appointmentDate,
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

exports.getAppointments = async (req, res) => {
  try {
    const { date, doctorName, status } = req.query;

    const filters = {};

    // Filtrar por doctor
    if (doctorName) {
      filters.doctorName = doctorName;
    }

    // Filtrar por estado
    if (status) {
      filters.status = status;
    }

    // Filtrar por fecha exacta (día completo)
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      filters.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
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

exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de cita inválido'
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: 'Cita no encontrada'
      });
    }

    res.status(200).json(appointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener la cita'
    });
  }
};

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

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de cita inválido' });
    }

    // Verificar existencia
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    // Validar horas
    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Validar fecha
    if (date) {
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        return res.status(400).json({
          message: 'La fecha no puede ser anterior a hoy'
        });
      }
    }

    // Detectar solapamientos (EXCLUYENDO la cita actual)
    if (doctorName || date || startTime || endTime) {
      const checkDoctor = doctorName || appointment.doctorName;
      const checkDate = date || appointment.date;
      const checkStart = startTime || appointment.startTime;
      const checkEnd = endTime || appointment.endTime;

      const overlappingAppointments = await Appointment.find({
        _id: { $ne: id }, // 👈 excluir la cita actual
        doctorName: checkDoctor,
        date: checkDate,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lt: checkEnd },
            endTime: { $gt: checkStart }
          }
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
    appointment.date = date ?? appointment.date;
    appointment.startTime = startTime ?? appointment.startTime;
    appointment.endTime = endTime ?? appointment.endTime;
    appointment.reason = reason ?? appointment.reason;
    appointment.status = status ?? appointment.status;

    await appointment.save();

    res.status(200).json(appointment);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al actualizar la cita'
    });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de cita inválido'
      });
    }

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        message: 'Cita no encontrada'
      });
    }

    res.status(200).json({
      message: 'Cita eliminada correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al eliminar la cita'
    });
  }
};

exports.checkConflicts = async (req, res) => {
  try {
    const {
      doctorName,
      date,
      startTime,
      endTime,
      excludeId
    } = req.query;

    // Validaciones básicas
    if (!doctorName || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Faltan parámetros requeridos'
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    const query = {
      doctorName,
      date: new Date(date),
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    // Excluir una cita específica (para ediciones)
    if (excludeId) {
      if (!mongoose.Types.ObjectId.isValid(excludeId)) {
        return res.status(400).json({
          message: 'excludeId inválido'
        });
      }
      query._id = { $ne: excludeId };
    }

    const conflicts = await Appointment.find(query).sort({ startTime: 1 });

    res.status(200).json(conflicts);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al verificar conflictos'
    });
  }
};
