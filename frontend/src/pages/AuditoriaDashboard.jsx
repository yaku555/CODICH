import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { getLogs, getResumen } from "../api/auditoria";
import "../styles/AuditoriaDashboard.css";

Chart.register(...registerables);

const NIVEL_CLASS = {
  INFO: "pill-info",
  WARN: "pill-warn",
  ERROR: "pill-error",
};

function TooltipTexto({ titulo, texto, ancho = "normal", bold = false }) {
  const contenido = texto || "Sin información";

  return (
    <span
      className="auditoria-tooltip"
      title={`${titulo}: ${contenido}`}
    >
      <span
        className={
          bold
            ? "auditoria-texto-cortado td-bold"
            : "auditoria-texto-cortado"
        }
      >
        {contenido}
      </span>

      <span
        className={
          ancho === "grande"
            ? "auditoria-tooltip-box auditoria-tooltip-box-grande"
            : "auditoria-tooltip-box"
        }
      >
        <strong>{titulo}:</strong>
        <br />
        {contenido}
      </span>
    </span>
  );
}

export default function AuditoriaDashboard() {
  const [logs, setLogs] = useState([]);
  const [resumen, setResumen] = useState({
    total: 0,
    exitosos: 0,
    advertencias: 0,
    errores: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [filtMod, setFiltMod] = useState("");
  const [filtNiv, setFiltNiv] = useState("");
  const [buscar, setBuscar] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const chartModRef = useRef(null);
  const chartNivRef = useRef(null);
  const chartModInst = useRef(null);
  const chartNivInst = useRef(null);

  const obtenerInicioDiaISO = (fecha) => {
    if (!fecha) return undefined;

    const [year, month, day] = fecha.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
  };

  const obtenerFinDiaISO = (fecha) => {
    if (!fecha) return undefined;

    const [year, month, day] = fecha.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
  };

  const obtenerFiltros = () => ({
    nivel: filtNiv || undefined,
    modulo: filtMod || undefined,
    usuario: buscar || undefined,
    fechaDesde: obtenerInicioDiaISO(fechaDesde),
    fechaHasta: obtenerFinDiaISO(fechaHasta),
  });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const filtros = obtenerFiltros();

      const [logsData, resumenData] = await Promise.all([
        getLogs(filtros),
        getResumen(filtros),
      ]);

      setLogs(logsData);
      setResumen(resumenData);
    } catch (err) {
      console.error("Error al cargar auditoría:", err);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtMod, filtNiv, buscar, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (cargando) return;

    const modulosLabels = [
      "Auth",
      "Socios",
      "Pagos",
      "Postulaciones",
      "Admin",
      "Soporte",
    ];

    const dataModulosReal = modulosLabels.map((mod) =>
      logs.filter((log) => log.modulo === mod).length
    );

    chartModInst.current?.destroy();

    if (chartModRef.current) {
      chartModInst.current = new Chart(chartModRef.current, {
        type: "bar",
        data: {
          labels: modulosLabels,
          datasets: [
            {
              label: "Eventos Reales",
              data: dataModulosReal,
              backgroundColor: "#1e5fa8",
              borderRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: {
                font: { size: 11 },
                color: "#888",
              },
              grid: { display: false },
            },
            y: {
              ticks: {
                font: { size: 11 },
                color: "#888",
                stepSize: 1,
              },
              grid: {
                color: "rgba(128,128,128,0.1)",
              },
            },
          },
        },
      });
    }

    chartNivInst.current?.destroy();

    if (chartNivRef.current) {
      chartNivInst.current = new Chart(chartNivRef.current, {
        type: "doughnut",
        data: {
          labels: ["INFO", "WARN", "ERROR"],
          datasets: [
            {
              data: [resumen.exitosos, resumen.advertencias, resumen.errores],
              backgroundColor: ["#1e5fa8", "#c47a18", "#b52c2c"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    return () => {
      chartModInst.current?.destroy();
      chartNivInst.current?.destroy();
    };
  }, [logs, resumen, cargando]);

  const obtenerActividadUsuariosReal = () => {
    const conteo = {};

    logs.forEach((log) => {
      const usuarioLog = log.usuario || "Sin usuario";
      const descripcionLog = log.descripcion || "Sin descripción";

      if (!conteo[usuarioLog]) {
        conteo[usuarioLog] = {
          nombre: usuarioLog,
          acciones: 0,
          ultimo:
            descripcionLog.length > 30
              ? `${descripcionLog.substring(0, 30)}...`
              : descripcionLog,
          fechaUltimo: new Date(log.fecha),
          ini: usuarioLog.substring(0, 2).toUpperCase(),
          color: "#1e5fa8",
        };
      }

      conteo[usuarioLog].acciones += 1;

      if (new Date(log.fecha) > conteo[usuarioLog].fechaUltimo) {
        conteo[usuarioLog].ultimo =
          descripcionLog.length > 30
            ? `${descripcionLog.substring(0, 30)}...`
            : descripcionLog;

        conteo[usuarioLog].fechaUltimo = new Date(log.fecha);
      }
    });

    return Object.values(conteo)
      .sort((a, b) => b.acciones - a.acciones)
      .slice(0, 4);
  };

  const formatearSoloFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);

    return fecha.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearHora = (fechaISO) => {
    const fecha = new Date(fechaISO);

    return fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const limpiarFiltros = () => {
    setFiltMod("");
    setFiltNiv("");
    setBuscar("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const usuariosActividadReal = obtenerActividadUsuariosReal();

  if (cargando) {
    return (
      <div className="auditoria-page">
        <div className="auditoria-cargando">
          Cargando logs del sistema...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auditoria-page">
        <div className="auditoria-error">
          <p>{error}</p>
          <button onClick={cargarDatos}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auditoria-page">
      <div className="auditoria-header">
        <div className="auditoria-titulo">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          Registro de auditoría y logs del sistema
        </div>

        <div className="auditoria-header-right">
          <span className="fecha-texto">
            {new Date().toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <span className="badge-activo">
            <span className="dot-verde"></span>
            Sistema activo
          </span>

          <button
            className="btn-recargar"
            onClick={cargarDatos}
            title="Recargar"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="metricas-grid">
        <div className="metrica-card">
          <p className="metrica-label">Eventos filtrados</p>
          <p className="metrica-valor">{resumen.total}</p>
          <p className="metrica-sub">Total según filtros</p>
        </div>

        <div className="metrica-card">
          <p className="metrica-label">Exitosos</p>
          <p className="metrica-valor success">{resumen.exitosos}</p>
          <p className="metrica-sub">
            {resumen.total
              ? ((resumen.exitosos / resumen.total) * 100).toFixed(1)
              : 0}
            % tasa éxito
          </p>
        </div>

        <div className="metrica-card">
          <p className="metrica-label">Advertencias</p>
          <p className="metrica-valor warning">{resumen.advertencias}</p>
          <p className="metrica-sub">
            {resumen.total
              ? ((resumen.advertencias / resumen.total) * 100).toFixed(1)
              : 0}
            % del total
          </p>
        </div>

        <div className="metrica-card">
          <p className="metrica-label">Errores</p>
          <p className="metrica-valor danger">{resumen.errores}</p>
          <p className="metrica-sub">
            {resumen.total
              ? ((resumen.errores / resumen.total) * 100).toFixed(1)
              : 0}
            % del total
          </p>
        </div>
      </div>

      <div className="card tabla-card">
        <p className="card-titulo">Log de actividad reciente</p>

        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Módulo</label>
            <select
              value={filtMod}
              onChange={(e) => setFiltMod(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Auth">Autenticación</option>
              <option value="Socios">Socios</option>
              <option value="Pagos">Pagos</option>
              <option value="Postulaciones">Postulaciones</option>
              <option value="Admin">Administración</option>
              <option value="Soporte">Soporte</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Nivel</label>
            <select
              value={filtNiv}
              onChange={(e) => setFiltNiv(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Desde</label>
            <input
              type="date"
              className="filtro-fecha"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Hasta</label>
            <input
              type="date"
              className="filtro-fecha"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          <input
            type="text"
            className="filtro-buscar"
            placeholder="Buscar usuario..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />

          <button
            type="button"
            className="btn-limpiar-filtros"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

        <div className="tabla-wrapper">
          <table className="log-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Nivel</th>
                <th>Módulo</th>
                <th>Usuario</th>
                <th>Descripción</th>
                <th>IP</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sin-resultados">
                    Sin resultados para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="td-mono">
                      {formatearSoloFecha(log.fecha)}
                    </td>

                    <td className="td-mono">
                      {formatearHora(log.fecha)}
                    </td>

                    <td>
                      <span className={`pill ${NIVEL_CLASS[log.nivel]}`}>
                        {log.nivel}
                      </span>
                    </td>

                    <td className="td-modulo">{log.modulo}</td>

                    <td className="td-usuario">
                      <TooltipTexto
                        titulo="Usuario"
                        texto={log.usuario}
                        bold
                      />
                    </td>

                    <td className="td-descripcion">
                      <TooltipTexto
                        titulo="Descripción"
                        texto={log.descripcion}
                        ancho="grande"
                      />
                    </td>

                    <td className="td-mono td-muted">
                      {log.ip || "desconocida"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="graficos-grid">
        <div className="card">
          <p className="card-titulo">Eventos por módulo</p>

          <div className="chart-wrapper">
            <canvas ref={chartModRef}></canvas>
          </div>
        </div>

        <div className="card">
          <p className="card-titulo">Distribución por nivel</p>

          <div className="chart-leyenda">
            <span>
              <span
                className="leyenda-sq"
                style={{ background: "#1e5fa8" }}
              ></span>
              INFO {resumen.exitosos}
            </span>

            <span>
              <span
                className="leyenda-sq"
                style={{ background: "#c47a18" }}
              ></span>
              WARN {resumen.advertencias}
            </span>

            <span>
              <span
                className="leyenda-sq"
                style={{ background: "#b52c2c" }}
              ></span>
              ERROR {resumen.errores}
            </span>
          </div>

          <div className="chart-wrapper chart-dona">
            <canvas ref={chartNivRef}></canvas>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-titulo">Actividad reciente por usuario</p>

        <div className="actividad-lista">
          {usuariosActividadReal.length === 0 ? (
            <div className="sin-resultados">
              No hay actividad de usuarios según los filtros aplicados.
            </div>
          ) : (
            usuariosActividadReal.map((usuario) => (
              <div key={usuario.nombre} className="actividad-row">
                <div
                  className="avatar"
                  style={{
                    background: `${usuario.color}22`,
                    color: usuario.color,
                  }}
                >
                  {usuario.ini}
                </div>

                <div className="actividad-info">
                  <span className="actividad-nombre">
                    {usuario.nombre}
                  </span>

                  <span className="actividad-desc">
                    {" "}
                    — {usuario.ultimo}
                  </span>

                  <div className="actividad-meta">
                    {usuario.acciones} acciones registradas
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}