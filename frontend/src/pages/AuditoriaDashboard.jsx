import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { getLogs, getResumen } from "../api/auditoria";
import "./AuditoriaDashboard.css";

Chart.register(...registerables);

const NIVEL_CLASS = { INFO: "pill-info", WARN: "pill-warn", ERROR: "pill-error" };

const USUARIOS_ACTIVIDAD = [
  { ini: "JV", nombre: "jvillalobos", acciones: 14, ultimo: "inicio de sesión",      ts: "hace 2 min",  color: "#1e5fa8" },
  { ini: "AD", nombre: "admin",       acciones: 28, ultimo: "membresía actualizada", ts: "hace 7 min",  color: "#1a7a4a" },
  { ini: "JO", nombre: "jolivar",     acciones: 6,  ultimo: "pago confirmado",        ts: "hace 25 min", color: "#7b2fa8" },
  { ini: "MC", nombre: "mcontreras",  acciones: 3,  ultimo: "intento de acceso",     ts: "hace 30 min", color: "#b56b0a" },
];

export default function AuditoriaDashboard() {
  const [logs, setLogs]         = useState([]);
  const [resumen, setResumen]   = useState({ total: 0, exitosos: 0, advertencias: 0, errores: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  const [filtMod, setFiltMod] = useState("");
  const [filtNiv, setFiltNiv] = useState("");
  const [buscar, setBuscar]   = useState("");

  const chartModRef  = useRef(null);
  const chartNivRef  = useRef(null);
  const chartModInst = useRef(null);
  const chartNivInst = useRef(null);

  // Carga inicial
  useEffect(() => {
    cargarDatos();
  }, []);

  // Re-fetch cuando cambian los filtros
  useEffect(() => {
    cargarLogs();
  }, [filtMod, filtNiv, buscar]);

  // Gráficos (se redibujan cuando cambia el resumen)
  useEffect(() => {
    if (cargando) return;
    dibujarGraficos();
    return () => {
      chartModInst.current?.destroy();
      chartNivInst.current?.destroy();
    };
  }, [resumen, cargando]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [logsData, resumenData] = await Promise.all([
        getLogs(),
        getResumen(),
      ]);
      setLogs(logsData);
      setResumen(resumenData);
    } catch (err) {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const cargarLogs = async () => {
    try {
      const data = await getLogs({
        nivel:   filtNiv  || undefined,
        modulo:  filtMod  || undefined,
        usuario: buscar   || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Error al filtrar logs:', err);
    }
  };

  const dibujarGraficos = () => {
    chartModInst.current?.destroy();
    if (chartModRef.current) {
      chartModInst.current = new Chart(chartModRef.current, {
        type: "bar",
        data: {
          labels: ["Auth", "Socios", "Pagos", "Postulaciones", "Admin"],
          datasets: [{
            label: "Eventos",
            data: [85, 60, 48, 34, 20],
            backgroundColor: "#1e5fa8",
            borderRadius: 5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: "#888" }, grid: { display: false } },
            y: { ticks: { font: { size: 11 }, color: "#888" }, grid: { color: "rgba(128,128,128,0.1)" } },
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
          datasets: [{
            data: [resumen.exitosos, resumen.advertencias, resumen.errores],
            backgroundColor: ["#1e5fa8", "#c47a18", "#b52c2c"],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: { legend: { display: false } },
        },
      });
    }
  };

  const formatearFecha = (fechaISO) => {
    const d = new Date(fechaISO);
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (cargando) {
    return (
      <div className="auditoria-page">
        <div className="auditoria-cargando">Cargando logs del sistema...</div>
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
      {/* Header */}
      <div className="auditoria-header">
        <div className="auditoria-titulo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          Registro de auditoría y logs del sistema
        </div>
        <div className="auditoria-header-right">
          <span className="fecha-texto">{new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })}</span>
          <span className="badge-activo">
            <span className="dot-verde"></span>
            Sistema activo
          </span>
          <button className="btn-recargar" onClick={cargarDatos} title="Recargar">↻</button>
        </div>
      </div>

      {/* Métricas */}
      <div className="metricas-grid">
        <div className="metrica-card">
          <p className="metrica-label">Eventos hoy</p>
          <p className="metrica-valor">{resumen.total}</p>
          <p className="metrica-sub">Total del día</p>
        </div>
        <div className="metrica-card">
          <p className="metrica-label">Exitosos</p>
          <p className="metrica-valor success">{resumen.exitosos}</p>
          <p className="metrica-sub">{resumen.total ? ((resumen.exitosos / resumen.total) * 100).toFixed(1) : 0}% tasa éxito</p>
        </div>
        <div className="metrica-card">
          <p className="metrica-label">Advertencias</p>
          <p className="metrica-valor warning">{resumen.advertencias}</p>
          <p className="metrica-sub">{resumen.total ? ((resumen.advertencias / resumen.total) * 100).toFixed(1) : 0}% del total</p>
        </div>
        <div className="metrica-card">
          <p className="metrica-label">Errores</p>
          <p className="metrica-valor danger">{resumen.errores}</p>
          <p className="metrica-sub">{resumen.total ? ((resumen.errores / resumen.total) * 100).toFixed(1) : 0}% del total</p>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="card tabla-card">
        <p className="card-titulo">Log de actividad reciente</p>
        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Módulo</label>
            <select value={filtMod} onChange={e => setFiltMod(e.target.value)}>
              <option value="">Todos</option>
              <option value="Auth">Autenticación</option>
              <option value="Socios">Socios</option>
              <option value="Pagos">Pagos</option>
              <option value="Postulaciones">Postulaciones</option>
              <option value="Admin">Administración</option>
            </select>
          </div>
          <div className="filtro-grupo">
            <label>Nivel</label>
            <select value={filtNiv} onChange={e => setFiltNiv(e.target.value)}>
              <option value="">Todos</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <input
            type="text"
            className="filtro-buscar"
            placeholder="Buscar usuario o acción..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
          />
        </div>

        <div className="tabla-wrapper">
          <table className="log-table">
            <thead>
              <tr>
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
                <tr><td colSpan={6} className="sin-resultados">Sin resultados para los filtros aplicados.</td></tr>
              ) : (
                logs.map(l => (
                  <tr key={l._id}>
                    <td className="td-mono">{formatearFecha(l.fecha)}</td>
                    <td><span className={`pill ${NIVEL_CLASS[l.nivel]}`}>{l.nivel}</span></td>
                    <td className="td-modulo">{l.modulo}</td>
                    <td className="td-bold">{l.usuario}</td>
                    <td>{l.descripcion}</td>
                    <td className="td-mono td-muted">{l.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos */}
      <div className="graficos-grid">
        <div className="card">
          <p className="card-titulo">Eventos por módulo (hoy)</p>
          <div className="chart-wrapper">
            <canvas ref={chartModRef} aria-label="Gráfico de barras de eventos por módulo">Autenticación 85, Socios 60, Pagos 48, Postulaciones 34, Administración 20.</canvas>
          </div>
        </div>

        <div className="card">
          <p className="card-titulo">Distribución por nivel</p>
          <div className="chart-leyenda">
            <span><span className="leyenda-sq" style={{ background: "#1e5fa8" }}></span>INFO {resumen.exitosos}</span>
            <span><span className="leyenda-sq" style={{ background: "#c47a18" }}></span>WARN {resumen.advertencias}</span>
            <span><span className="leyenda-sq" style={{ background: "#b52c2c" }}></span>ERROR {resumen.errores}</span>
          </div>
          <div className="chart-wrapper chart-dona">
            <canvas ref={chartNivRef} aria-label="Gráfico de dona con distribución por nivel">INFO {resumen.exitosos}, WARN {resumen.advertencias}, ERROR {resumen.errores}.</canvas>
          </div>
        </div>
      </div>

      {/* Actividad por usuario */}
      <div className="card">
        <p className="card-titulo">Actividad reciente por usuario</p>
        <div className="actividad-lista">
          {USUARIOS_ACTIVIDAD.map(u => (
            <div key={u.nombre} className="actividad-row">
              <div className="avatar" style={{ background: u.color + "22", color: u.color }}>{u.ini}</div>
              <div className="actividad-info">
                <span className="actividad-nombre">{u.nombre}</span>
                <span className="actividad-desc"> — {u.ultimo}</span>
                <div className="actividad-meta">{u.acciones} acciones hoy · {u.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}