const cron = require("node-cron");
const { crearBackup } = require("./backup.service.js");


// funcion para el backup automatico, 
const iniciarBackupAutomatico = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const backup = await crearBackup("Sistema automático");

      console.log("Backup automático generado:", backup.nombreArchivo);

    } catch (error) {
      console.error("Error en backup automático:", error);
    }
  });
};

module.exports = iniciarBackupAutomatico;