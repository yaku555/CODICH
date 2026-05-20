const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const usuarioRoutes = require('./routes/usuario.routes');

console.log("PORT leído:", process.env.PORT);
console.log("MONGO_URI existe:", !!process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API de CODICH-Manager funcionando');
});

// Rutas
app.use('/api/usuarios', usuarioRoutes);

const PORT = process.env.PORT || 6767;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

const conectarDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB conectado: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a la BD: ${error.message}`);
  }
};

conectarDB();