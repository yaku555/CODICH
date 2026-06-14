const cron = require("node-cron");
const { crearBackup } = require("./backup.service.js");
// const { enviarCorreoSoporte } = require("../utils/correo.service.js");

const iniciarBackupAutomatico = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const backup = await crearBackup("Sistema automático");

      console.log("Backup automático generado:", backup.nombreArchivo);

      // Aquí puedes conectar tu servicio de correo real
      /*
      await enviarCorreoSoporte({
        asunto: "Backup automático exitoso",
        mensaje: `El respaldo ${backup.nombreArchivo} fue generado correctamente.`,
      });
      */
    } catch (error) {
      console.error("Error en backup automático:", error);

      // Aquí también puedes enviar correo de fallo
      /*
      await enviarCorreoSoporte({
        asunto: "Error en backup automático",
        mensaje: error.message || "Error desconocido al generar backup.",
      });
      */
    }
  });
};

module.exports = iniciarBackupAutomatico;