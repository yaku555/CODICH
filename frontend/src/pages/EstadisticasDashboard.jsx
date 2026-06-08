import { useState, useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import { getEstadisticas } from "../api/estadisticas";
import "../styles/EstadisticasDashboard.css";

Chart.register(...registerables);

const HOY = new Date().toISOString().split("T")[0];
const HACE_30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function EstadisticasDashboard() {
  const [datos, setDatos]       = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [desde, setDesde]       = useState(HACE_30);
  const [hasta, setHasta]       = useState(HOY);
  const [metrica, setMetrica]   = useState("todos");

  const chartSociosRef   = useRef(null);
  const chartMemRef      = useRef(null);
  const chartPostRef     = useRef(null);
  const chartSociosInst  = useRef(null);
  const chartMemInst     = useRef(null);
  const chartPostInst    = useRef(null);

  const sinDatos = !datos || (
    datos.totalSocios === 0 &&
    datos.membresiasVigentes === 0 &&
    datos.postulacionesPendientes === 0
  );

  // Fetch de estadísticas
  useEffect(() => {
    let activo = true;
    async function fetchStats() {
      try {
        setCargando(true);
        setError(null);
        const data = await getEstadisticas({ desde, hasta, metrica });
        if (activo) setDatos(data);
      } catch {
        if (activo) setError("No se pudieron cargar las estadísticas. Intenta de nuevo.");
      } finally {
        if (activo) setCargando(false);
      }
    }
    fetchStats();
    return () => { activo = false; };
  }, [desde, hasta, metrica]);

  // Gráficos
  const dibujarGraficos = useCallback(() => {
    if (!datos) return;

    // Gráfico socios por profesión
    chartSociosInst.current?.destroy();
    if (chartSociosRef.current) {
      chartSociosInst.current = new Chart(chartSociosRef.current, {
        type: "bar",
        data: {
          labels: datos.sociosPorProfesion?.map(s => s._id) ?? [],
          datasets: [{
            label: "Socios",
            data: datos.sociosPorProfesion?.map(s => s.cantidad) ?? [],
            backgroundColor: "#111827",
            borderRadius: 5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: "#888" }, grid: { display: false } },
            y: { ticks: { font: { size: 11 }, color: "#888" }, grid: { color: "rgba(128,128,128,0.1)" } },
          },
        },
      });
    }

    // Gráfico membresías activas vs vencidas
    chartMemInst.current?.destroy();
    if (chartMemRef.current) {
      chartMemInst.current = new Chart(chartMemRef.current, {
        type: "doughnut",
        data: {
          labels: ["Vigentes", "Vencidas"],
          datasets: [{
            data: [datos.membresiasVigentes ?? 0, datos.membresiasVencidas ?? 0],
            backgroundColor: ["#111827", "#e5e7eb"],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: "68%",
          plugins: { legend: { display: false } },
        },
      });
    }

    // Gráfico postulaciones por estado
    chartPostInst.current?.destroy();
    if (chartPostRef.current) {
      chartPostInst.current = new Chart(chartPostRef.current, {
        type: "bar",
        data: {
          labels: datos.postulacionesPorEstado?.map(p => p._id) ?? [],
          datasets: [{
            label: "Postulaciones",
            data: datos.postulacionesPorEstado?.map(p => p.cantidad) ?? [],
            backgroundColor: ["#111827", "#f5c518", "#e5e7eb", "#b91c1c"],
            borderRadius: 5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 11 }, color: "#888" }, grid: { display: false } },
            y: { ticks: { font: { size: 11 }, color: "#888" }, grid: { color: "rgba(128,128,128,0.1)" } },
          },
        },
      });
    }
  }, [datos]);

  useEffect(() => {
    if (cargando || !datos) return;
    dibujarGraficos();
    return () => {
      chartSociosInst.current?.destroy();
      chartMemInst.current?.destroy();
      chartPostInst.current?.destroy();
    };
  }, [dibujarGraficos, cargando, datos]);

  const recargar = () => {
    setDesde(HACE_30);
    setHasta(HOY);
    setMetrica("todos");
  };

  return (
    <div className="stats-page">

      {/* Header */}
      <div className="stats-header">
        <div className="stats-titulo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
          Estadísticas de gestión
        </div>
        <button className="stats-btn-recargar" onClick={recargar} title="Restablecer filtros">↻</button>
      </div>

      {/* Filtros obligatorios (HU002) */}
      <div className="stats-filtros-card">
        <p className="stats-filtros-titulo">Filtros</p>
        <div className="stats-filtros-row">
          <div className="stats-filtro-grupo">
            <label>Desde</label>
            <input type="date" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="stats-filtro-grupo">
            <label>Hasta</label>
            <input type="date" value={hasta} min={desde} max={HOY} onChange={e => setHasta(e.target.value)} />
          </div>
          <div className="stats-filtro-grupo">
            <label>Tipo de métrica</label>
            <select value={metrica} onChange={e => setMetrica(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="socios">Socios</option>
              <option value="membresias">Membresías</option>
              <option value="postulaciones">Postulaciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estados */}
      {cargando && <div className="stats-estado">Cargando estadísticas...</div>}
      {error    && <div className="stats-estado stats-error"><p>{error}</p><button onClick={recargar}>Reintentar</button></div>}

      {!cargando && !error && sinDatos && (
        <div className="stats-estado stats-sin-datos">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Sin registros para el período y métrica seleccionados.</p>
        </div>
      )}

      {!cargando && !error && !sinDatos && (
        <>
          {/* Tarjetas métricas */}
          <div className="stats-metricas-grid">
            <div className="stats-metrica-card">
              <p className="stats-metrica-label">Total socios</p>
              <p className="stats-metrica-valor">{datos.totalSocios ?? 0}</p>
              <p className="stats-metrica-sub">registrados</p>
            </div>
            <div className="stats-metrica-card">
              <p className="stats-metrica-label">Membresías vigentes</p>
              <p className="stats-metrica-valor success">{datos.membresiasVigentes ?? 0}</p>
              <p className="stats-metrica-sub">activas hoy</p>
            </div>
            <div className="stats-metrica-card">
              <p className="stats-metrica-label">Postulaciones pendientes</p>
              <p className="stats-metrica-valor warning">{datos.postulacionesPendientes ?? 0}</p>
              <p className="stats-metrica-sub">en revisión</p>
            </div>
            <div className="stats-metrica-card">
              <p className="stats-metrica-label">Postulaciones aprobadas</p>
              <p className="stats-metrica-valor success">{datos.postulacionesAprobadas ?? 0}</p>
              <p className="stats-metrica-sub">en el período</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="stats-graficos-grid">

            {(metrica === "todos" || metrica === "socios") && (
              <div className="stats-card">
                <p className="stats-card-titulo">Socios por profesión</p>
                <div className="stats-chart-wrapper">
                  <canvas ref={chartSociosRef} aria-label="Gráfico socios por profesión"></canvas>
                </div>
              </div>
            )}

            {(metrica === "todos" || metrica === "membresias") && (
              <div className="stats-card">
                <p className="stats-card-titulo">Estado membresías</p>
                <div className="stats-leyenda">
                  <span><span className="stats-sq" style={{ background: "#111827" }}></span>Vigentes {datos.membresiasVigentes ?? 0}</span>
                  <span><span className="stats-sq" style={{ background: "#e5e7eb" }}></span>Vencidas {datos.membresiasVencidas ?? 0}</span>
                </div>
                <div className="stats-chart-wrapper stats-chart-dona">
                  <canvas ref={chartMemRef} aria-label="Gráfico membresías vigentes vs vencidas"></canvas>
                </div>
              </div>
            )}

            {(metrica === "todos" || metrica === "postulaciones") && (
              <div className="stats-card">
                <p className="stats-card-titulo">Postulaciones por estado</p>
                <div className="stats-chart-wrapper">
                  <canvas ref={chartPostRef} aria-label="Gráfico postulaciones por estado"></canvas>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}