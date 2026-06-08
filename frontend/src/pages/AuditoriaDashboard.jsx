import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { getLogs, getResumen } from "../api/auditoria";
import "../styles/AuditoriaDashboard.css";

//hola

Chart.register(...registerables);

const NIVEL_CLASS = { INFO: "pill-info", WARN: "pill-warn", ERROR: "pill-error" };

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

  // 1. CARGA INICIAL DE DATOS (Se ejecuta una sola vez al abrir la página)
  useEffect(() => {
    async function cargarDatosIniciales() {
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
        console.error(err);
        setError('No se pudo conectar con el servidor. Intenta de nuevo.');
      } finally {
        setCargando(false);
      }
    }
    cargarDatosIniciales();
  }, []);

  // 2. FILTRADO REACTIVO (Se ejecuta cada vez que el usuario usa los selectores o el buscador)
  useEffect(() => {
    async function filtrarLogs() {
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
    }
    
    // Evitamos llamadas innecesarias en la primera carga
    if (!cargando) {
      filtrarLogs();
    }
  }, [filtMod, filtNiv, buscar, cargando]);

  // 3. RENDERIZADO DE GRÁFICOS (Se activa cuando cambia la data o el resumen)
  useEffect(() => {
    if (cargando) return;

    // --- Gráfico de Barras (Módulos) ---
    const modulosLabels = ["Auth", "Socios", "Pagos", "Postulaciones", "Admin"];
    const dataModulosReal = modulosLabels.map(mod => logs.filter(log => log.modulo === mod).length);

    chartModInst.current?.destroy();
    if (chartModRef.current) {
      chartModInst.current = new Chart(chartModRef.current, {
        type: "bar",
        data: {
          labels: modulosLabels,
          datasets: [{
            label: "Eventos Reales",
            data: dataModulosReal,
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
            y: { ticks: { font: { size: 11 }, color: "#888", stepSize: 1 }, grid: { color: "rgba(128,128,128,0.1)" } },
          },
        },
      });
    }

    // --- Gráfico de Dona (Niveles) ---
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

    return () => {
      chartModInst.current?.destroy();
      chartNivInst.current?.destroy();
    };
  }, [logs, resumen, cargando]);

  // 4. PROCESAMIENTO DE USUARIOS EN TIEMPO REAL
  const obtenerActividadUsuariosReal = () => {
    const conteo = {};
    logs.forEach(l => {
      if (!conteo[l.usuario]) {
        conteo[l.usuario] = {
          nombre: l.usuario,
          acciones: 0,
          ultimo: l.descripcion.length > 30 ? l.descripcion.substring(0, 30) + "..." : l.descripcion,
          fechaUltimo: new Date(l.fecha),
          ini: l.usuario.substring(0, 2).toUpperCase(),
          color: "#1e5fa8"
        };
      }
      conteo[l.usuario].acciones += 1;
      if (new Date(l.fecha) > conteo[l.usuario].fechaUltimo) {
        conteo[l.usuario].ultimo = l.descripcion.length > 30 ? l.descripcion.substring(0, 30) + "..." : l.descripcion;
        conteo[l.usuario].fechaUltimo = new Date(l.fecha);
      }
    });
    return Object.values(conteo).sort((a, b) => b.acciones - a.acciones).slice(0, 4);
  };

  const formatearFecha = (fechaISO) => {
    const d = new Date(fechaISO);
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const usuariosActividadReal = obtenerActividadUsuariosReal();

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
          <button onClick={() => window.location.reload()}>Reintentar</button>
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
          <button className="btn-recargar" onClick={() => window.location.reload()} title="Recargar">↻</button>
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
            <canvas ref={chartModRef}></canvas>
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
            <canvas ref={chartNivRef}></canvas>
          </div>
        </div>
      </div>

      {/* Actividad reciente por usuario */}
      <div className="card">
        <p className="card-titulo">Actividad reciente por usuario</p>
        <div className="actividad-lista">
          {usuariosActividadReal.length === 0 ? (
            <div className="sin-resultados">No hay actividad de usuarios hoy.</div>
          ) : (
            usuariosActividadReal.map(u => (
              <div key={u.nombre} className="actividad-row">
                <div className="avatar" style={{ background: u.color + "22", color: u.color }}>{u.ini}</div>
                <div className="actividad-info">
                  <span className="actividad-nombre">{u.nombre}</span>
                  <span className="actividad-desc"> — {u.ultimo}</span>
                  <div className="actividad-meta">{u.acciones} acciones hoy</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}