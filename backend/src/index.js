import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';



console.log("PORT leído:", process.env.PORT);
console.log("MONGO_URI existe:", !!process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API de CODICH-Manager funcionando');
});

const PORT = process.env.PORT || 4000;

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