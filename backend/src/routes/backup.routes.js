const { Router } = require("express");

const {
  crearBackupManual,
  obtenerHistorialBackups,
  restaurarBackupController,
} = require("../controllers/backup.controller.js");

const router = Router();

router.get("/", obtenerHistorialBackups);
router.post("/crear", crearBackupManual);
router.post("/:id/restaurar", restaurarBackupController);

module.exports = router;