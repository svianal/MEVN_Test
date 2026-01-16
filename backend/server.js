const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const appointmentRoutes = require('./src/routes/appointmentRoutes');

const app = express();

/**
 * CORS CONTROLADO
 * Solo permite el frontend en localhost:5173 (Vite)
 */
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use('/api', appointmentRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
