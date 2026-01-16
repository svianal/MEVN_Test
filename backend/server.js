const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const appointmentRoutes = require('./src/routes/appointmentRoutes');

const app = express();

app.use(express.json());
app.use('/api', appointmentRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
