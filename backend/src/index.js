import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';



// 2. Inicializar la app de Express
const app = express();

// 3. Middlewares globales
app.use(cors());
app.use(express.json()); // Para poder recibir JSON en el body de las peticiones

// 4. Conexión directa a MongoDB integrada en index.js
const conectarDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Conectado: ${connection.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión a la BD: ${error.message}`);
        process.exit(1);
    }
};
conectarDB();

// 5. Carga de Rutas (Las carpetas routes/ se mantendrán aparte)
// Ejemplo futuro: app.use('/api/socios', require('./routes/socioRoutes'));

// Ruta base de prueba
app.get('/', (req, res) => {
    res.send('API de CODICH-Manager unificada funcionando');
});

// 6. Lanzar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});