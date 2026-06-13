const {
  crearBackup,
  listarBackups,
  restaurarBackup,
} = require("../utils/backup.service.js");

const { enviarCorreoSoporte } = require("../utils/correo.service.js");

const crearBackupManual = async (req, res) => {
  try {
    const backup = await crearBackup("Soporte técnico");

    let correoEnviado = false;
    let errorCorreo = null;

    try {
      if (typeof enviarCorreoSoporte !== "function") {
        throw new Error("La función enviarCorreoSoporte no está disponible.");
      }

      await enviarCorreoSoporte({
        asunto: "Backup manual exitoso",
        mensaje: `
        El respaldo manual fue generado correctamente.

        Archivo: ${backup.nombreArchivo}
        Tamaño: ${backup.tamanoBytes} bytes
        Fecha: ${new Date(backup.createdAt).toLocaleString("es-CL")}
        Ejecutado por: ${backup.ejecutadoPor}
        `,
      });

      correoEnviado = true;
    } catch (error) {
      console.error("Error al enviar correo de backup:", error.message);
      errorCorreo = error.message;
    }

    return res.status(201).json({
      mensaje: "Backup generado correctamente.",
      backup: {
        id: backup._id,
        nombreArchivo: backup.nombreArchivo,
        rutaArchivo: backup.rutaArchivo,
        tamanoBytes: backup.tamanoBytes,
        estado: backup.estado,
        mensaje: backup.mensaje,
        createdAt: backup.createdAt,
      },
      correoEnviado,
      errorCorreo,
    });
  } catch (error) {
    console.error("Error al generar backup manual:", error);

    return res.status(500).json({
      mensaje: "Error al generar el backup.",
      error: error.message || error.mensaje || "Error desconocido",
    });
  }
};

const obtenerHistorialBackups = async (req, res) => {
  try {
    const backups = await listarBackups();
    return res.json(backups);
  } catch (error) {
    console.error("Error al obtener historial de backups:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial de backups.",
      error: error.message,
    });
  }
};

const restaurarBackupController = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmacion } = req.body;

    if (confirmacion !== "CONFIRMO_RESTAURAR") {
      return res.status(400).json({
        mensaje:
          "Confirmación inválida. Esto reemplazará la información actual.",
      });
    }

    const resultado = await restaurarBackup(id);
    return res.json(resultado);
  } catch (error) {
    console.error("Error al restaurar backup:", error);

    return res.status(500).json({
      mensaje: "Error al restaurar el backup.",
      error: error.message,
    });
  }
};

module.exports = {
  crearBackupManual,
  obtenerHistorialBackups,
  restaurarBackupController,
};