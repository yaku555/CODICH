const mongoose = require("mongoose");

const backupHistorialSchema = new mongoose.Schema(
  {
    nombreArchivo: {
      type: String,
      required: true,
    },
    rutaArchivo: {
      type: String,
      required: true,
    },
    tamanoBytes: {
      type: Number,
      default: 0,
    },
    estado: {
      type: String,
      enum: ["EXITO", "FALLA"],
      required: true,
    },
    mensaje: {
      type: String,
      default: "",
    },
    ejecutadoPor: {
      type: String,
      default: "Sistema automático",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BackupHistorial", backupHistorialSchema);