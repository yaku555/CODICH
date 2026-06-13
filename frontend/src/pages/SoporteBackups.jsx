import { useEffect, useState } from "react";
import {
  getBackupsRequest,
  crearBackupRequest,
  restaurarBackupRequest,
} from "../api/backups.js";
import "../styles/SoporteBackups.css";

function SoporteBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarBackups = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await getBackupsRequest();
      setBackups(data);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el historial de backups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBackups();
  }, []);

  const crearBackup = async () => {
    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const { data } = await crearBackupRequest();

      if (data.correoEnviado === true) {
        setMensaje("Backup creado correctamente y correo enviado a soporte.");
      } else if (data.correoEnviado === false) {
        setMensaje(
          `Backup creado correctamente, pero no se pudo enviar el correo. ${
            data.errorCorreo ? `Detalle: ${data.errorCorreo}` : ""
          }`
        );
      } else {
        setMensaje("Backup creado correctamente.");
      }

      await cargarBackups();
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.mensaje || "No se pudo crear el backup."
      );
    } finally {
      setProcesando(false);
    }
  };

  const restaurarBackup = async (backup) => {
    const primeraConfirmacion = window.confirm(
      "Esto reemplazará la información actual. ¿Deseas continuar?"
    );

    if (!primeraConfirmacion) return;

    const segundaConfirmacion = window.confirm(
      `Confirmación final: se restaurará el backup "${backup.nombreArchivo}". Esta acción reemplazará los datos actuales.`
    );

    if (!segundaConfirmacion) return;

    try {
      setProcesando(true);
      setMensaje("");
      setError("");

      const { data } = await restaurarBackupRequest(backup._id);

      setMensaje(data.mensaje || "Base de datos restaurada correctamente.");

      await cargarBackups();
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.mensaje || "No se pudo restaurar el backup."
      );
    } finally {
      setProcesando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";

    return new Date(fecha).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearTamano = (bytes) => {
    const valor = Number(bytes || 0);

    if (valor < 1024) {
      return `${valor} B`;
    }

    if (valor < 1024 * 1024) {
      return `${(valor / 1024).toFixed(2)} KB`;
    }

    return `${(valor / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <main className="soporte-backups-page">
      <section className="soporte-backups-header">
        <div>
          <p className="soporte-backups-subtitulo">Soporte técnico</p>
          <h1>Respaldos de base de datos</h1>
          <p className="soporte-backups-descripcion">
            Historial de respaldos generados por el sistema y restauración
            controlada de información.
          </p>
        </div>

        <button
          type="button"
          className="backup-btn-primary"
          onClick={crearBackup}
          disabled={procesando}
        >
          {procesando ? "Procesando..." : "Crear backup"}
        </button>
      </section>

      {mensaje && <div className="backup-alert backup-alert-success">{mensaje}</div>}
      {error && <div className="backup-alert backup-alert-error">{error}</div>}

      <section className="backup-card">
        <div className="backup-card-header">
          <h2>Historial de backups</h2>
          <button
            type="button"
            className="backup-btn-secondary"
            onClick={cargarBackups}
            disabled={loading || procesando}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <p className="backup-empty">Cargando historial...</p>
        ) : backups.length === 0 ? (
          <p className="backup-empty">No existen backups registrados.</p>
        ) : (
          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Tamaño</th>
                  <th>Estado</th>
                  <th>Mensaje</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {backups.map((backup) => (
                  <tr key={backup._id}>
                    <td>{formatearFecha(backup.createdAt)}</td>
                    <td>{backup.nombreArchivo}</td>
                    <td>{formatearTamano(backup.tamanoBytes)}</td>
                    <td>
                      <span
                        className={
                          backup.estado === "EXITO"
                            ? "backup-status success"
                            : "backup-status error"
                        }
                      >
                        {backup.estado}
                      </span>
                    </td>
                    <td>{backup.mensaje || "Sin mensaje"}</td>
                    <td>
                      <button
                        type="button"
                        className="backup-btn-danger"
                        onClick={() => restaurarBackup(backup)}
                        disabled={procesando || backup.estado !== "EXITO"}
                      >
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default SoporteBackups;