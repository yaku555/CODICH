const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const BackupHistorial = require("../models/BackupHistorial.js");

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUPS = 30;

// revisa que exista la carpeta donde se guardaran los backups
const asegurarCarpetaBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

// genera un nombre unico para cada backup usando la fecha y hora actual
const generarNombreBackup = () => {
  const fecha = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\./g, "-");

  return `backup-${fecha}.json`;
};

// mantiene solo los ultimos 30 backups y elimina los mas antiguos
const rotarBackups = async () => {
  const backups = await BackupHistorial.find()
    .sort({ createdAt: -1 });

  const backupsAEliminar = backups.slice(MAX_BACKUPS);

  for (const backup of backupsAEliminar) {
    if (backup.rutaArchivo && fs.existsSync(backup.rutaArchivo)) {
      fs.unlinkSync(backup.rutaArchivo);
    }

    await BackupHistorial.findByIdAndDelete(backup._id);
  }
};

// crea un respaldo completo de las colecciones de la base de datos
const crearBackup = async (ejecutadoPor = "Sistema automático") => {
  asegurarCarpetaBackups();

  const nombreArchivo = generarNombreBackup();
  const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);

  try {
    const colecciones = await mongoose.connection.db.listCollections().toArray();

    const respaldo = {
      fechaGeneracion: new Date().toISOString(),
      baseDatos: mongoose.connection.name,
      colecciones: {},
    };

    // recorre las colecciones y guarda sus documentos dentro del archivo json
    for (const coleccion of colecciones) {
      const nombreColeccion = coleccion.name;

      if (
        nombreColeccion.startsWith("system.") ||
        nombreColeccion === "backuphistorials"
      ) {
        continue;
      }

      const documentos = await mongoose.connection.db
        .collection(nombreColeccion)
        .find({})
        .toArray();

      respaldo.colecciones[nombreColeccion] = documentos;
    }

    fs.writeFileSync(rutaArchivo, JSON.stringify(respaldo, null, 2), "utf-8");

    const stats = fs.statSync(rutaArchivo);

    // guarda en el historial que el backup se creo correctamente
    const registro = await BackupHistorial.create({
      nombreArchivo,
      rutaArchivo,
      tamanoBytes: stats.size,
      estado: "EXITO",
      mensaje: "Respaldo generado correctamente.",
      ejecutadoPor,
    });

    await rotarBackups();

    return registro;
  } catch (error) {
    // si algo falla, igual se registra el intento en el historial
    const registro = await BackupHistorial.create({
      nombreArchivo,
      rutaArchivo,
      tamanoBytes: 0,
      estado: "FALLA",
      mensaje: error.message,
      ejecutadoPor,
    });

    await rotarBackups();

    throw registro;
  }
};

// lista los backups disponibles, mostrando solo los ultimos 30
const listarBackups = async () => {
  await rotarBackups();

  return BackupHistorial.find()
    .sort({ createdAt: -1 })
    .limit(MAX_BACKUPS);
};

// restaura la base de datos usando el archivo de respaldo seleccionado
const restaurarBackup = async (backupId) => {
  const backup = await BackupHistorial.findById(backupId);

  if (!backup) {
    throw new Error("Backup no encontrado.");
  }

  if (backup.estado !== "EXITO") {
    throw new Error("No se puede restaurar un backup fallido.");
  }

  if (!fs.existsSync(backup.rutaArchivo)) {
    throw new Error("El archivo físico del backup no existe.");
  }

  const contenido = fs.readFileSync(backup.rutaArchivo, "utf-8");
  const respaldo = JSON.parse(contenido);

  const colecciones = respaldo.colecciones || {};

  // vacia cada coleccion y luego vuelve a insertar los datos guardados
  for (const nombreColeccion of Object.keys(colecciones)) {
    await mongoose.connection.db.collection(nombreColeccion).deleteMany({});

    if (colecciones[nombreColeccion].length > 0) {
      await mongoose.connection.db
        .collection(nombreColeccion)
        .insertMany(colecciones[nombreColeccion]);
    }
  }

  return {
    mensaje: "Base de datos restaurada correctamente.",
    backupRestaurado: backup.nombreArchivo,
  };
};

module.exports = {
  crearBackup,
  listarBackups,
  restaurarBackup,
  rotarBackups,
};