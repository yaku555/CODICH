const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const auditoriaMiddleware = require('./middleware/auditoriaMiddleware');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const forzarHttps = require('./middleware/forzarHttps');

const usuarioRoutes = require('./routes/usuario.routes');
const postulacionRoutes = require('./routes/postulacion.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const pagoRoutes = require('./routes/pago.routes');
const contactoRoutes = require('./routes/contacto.routes');

const app = express();

app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use(auditoriaMiddleware);
app.use(forzarHttps);

app.get('/', (req, res) => {
  res.send('API de CODICH-Manager funcionando');
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/postulaciones', postulacionRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/contacto', contactoRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

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