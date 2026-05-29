const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importa tus rutas
const usuarioRoutes = require('./routes/usuario.routes');
const postulacionRoutes = require('./routes/postulacion.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const pagoRoutes = require('./routes/pago.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API de CODICH-Manager funcionando');
});

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/postulaciones', postulacionRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/pagos', pagoRoutes);

const PORT = process.env.PORT || 6767;

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB conectado exitosamente");

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error(`Error de conexión a la BD: ${error.message}`);
    process.exit(1);
  }
};

conectarDB();