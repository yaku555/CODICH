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

  const chartIngresosRef     = useRef(null);
  const chartMemRef          = useRef(null);
  const chartMorosidadRef    = useRef(null);
  const chartIngresosInst    = useRef(null);
  const chartMemInst         = useRef(null);
  const chartMorosidadInst   = useRef(null);

  // Fetch de estadísticas
  useEffect(() => {
    let activo = true;
    async function fetchStats() {
      try {
        setCargando(true);
        setError(null);
        const data = await getEstadisticas({ desde, hasta, tipoReporte: metrica });
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

    // Gráfico Ingresos por Plan
    if (datos.ingresos && (metrica === 'todos' || metrica === 'ingresos')) {
      chartIngresosInst.current?.destroy();
      if (chartIngresosRef.current) {
        chartIngresosInst.current = new Chart(chartIngresosRef.current, {
          type: "bar",
          data: {
            labels: datos.ingresos.ingresosPorPlan?.map(p => p._id) ?? [],
            datasets: [{
              label: "Total ($)",
              data: datos.ingresos.ingresosPorPlan?.map(p => p.total) ?? [],
              backgroundColor: "#111827",
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
    }

    // Gráfico Membresías
    if (datos.morosidad && (metrica === 'todos' || metrica === 'morosidad')) {
      chartMemInst.current?.destroy();
      if (chartMemRef.current) {
        chartMemInst.current = new Chart(chartMemRef.current, {
          type: "doughnut",
          data: {
            labels: ["Activas", "Morosas"],
            datasets: [{
              data: [datos.morosidad.totalActivas ?? 0, datos.morosidad.totalMorosas ?? 0],
              backgroundColor: ["#059669", "#dc2626"],
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
    }

    // Gráfico Morosidad por Estado
    if (datos.morosidad && (metrica === 'todos' || metrica === 'morosidad')) {
      chartMorosidadInst.current?.destroy();
      if (chartMorosidadRef.current) {
        chartMorosidadInst.current = new Chart(chartMorosidadRef.current, {
          type: "bar",
          data: {
            labels: datos.morosidad.morosidadPorEstado?.map(m => m._id) ?? [],
            datasets: [{
              label: "Cantidad",
              data: datos.morosidad.morosidadPorEstado?.map(m => m.cantidad) ?? [],
              backgroundColor: ["#059669", "#dc2626", "#f59e0b"],
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
    }
  }, [datos, metrica]);

  useEffect(() => {
    if (cargando || !datos) return;
    dibujarGraficos();
    return () => {
      chartIngresosInst.current?.destroy();
      chartMemInst.current?.destroy();
      chartMorosidadInst.current?.destroy();
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
              <option value="ingresos">Ingresos</option>
              <option value="inscritos">Inscritos</option>
              <option value="morosidad">Morosidad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estados */}
      {cargando && <div className="stats-estado">Cargando estadísticas...</div>}
      {error    && <div className="stats-estado stats-error"><p>{error}</p><button onClick={recargar}>Reintentar</button></div>}

      {!cargando && !error && !datos?.hayRegistros && (
        <div className="stats-estado stats-sin-datos">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Sin registros para el período y métrica seleccionados.</p>
        </div>
      )}

      {!cargando && !error && datos?.hayRegistros && (
        <>
          {/* Tarjetas métricas */}
          <div className="stats-metricas-grid">
            {(metrica === 'todos' || metrica === 'ingresos') && datos.ingresos && (
              <>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Total ingresos</p>
                  <p className="stats-metrica-valor">${datos.ingresos.totalIngresos?.toFixed(2) ?? 0}</p>
                  <p className="stats-metrica-sub">en el período</p>
                </div>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Cantidad de pagos</p>
                  <p className="stats-metrica-valor">{datos.ingresos.cantidadPagos ?? 0}</p>
                  <p className="stats-metrica-sub">procesados</p>
                </div>
              </>
            )}
            
            {(metrica === 'todos' || metrica === 'inscritos') && datos.nuevosInscritos && (
              <>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Nuevos inscritos</p>
                  <p className="stats-metrica-valor">{datos.nuevosInscritos.totalNuevosInscritos ?? 0}</p>
                  <p className="stats-metrica-sub">en el período</p>
                </div>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Altas pagadas</p>
                  <p className="stats-metrica-valor success">{datos.nuevosInscritos.totalAltasPagadas ?? 0}</p>
                  <p className="stats-metrica-sub">confirmadas</p>
                </div>
              </>
            )}

            {(metrica === 'todos' || metrica === 'morosidad') && datos.morosidad && (
              <>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Total membresías</p>
                  <p className="stats-metrica-valor">{datos.morosidad.totalMembresias ?? 0}</p>
                  <p className="stats-metrica-sub">en el período</p>
                </div>
                <div className="stats-metrica-card">
                  <p className="stats-metrica-label">Tasa morosidad</p>
                  <p className="stats-metrica-valor warning">{datos.morosidad.tasaMorosidad ?? 0}%</p>
                  <p className="stats-metrica-sub">de membresías morosas</p>
                </div>
              </>
            )}
          </div>

          {/* Gráficos */}
          <div className="stats-graficos-grid">
            {(metrica === 'todos' || metrica === 'ingresos') && datos.ingresos && (
              <div className="stats-card">
                <p className="stats-card-titulo">Ingresos por plan</p>
                <div className="stats-chart-wrapper">
                  <canvas ref={chartIngresosRef} aria-label="Gráfico ingresos por plan"></canvas>
                </div>
              </div>
            )}

            {(metrica === 'todos' || metrica === 'morosidad') && datos.morosidad && (
              <>
                <div className="stats-card">
                  <p className="stats-card-titulo">Estado membresías</p>
                  <div className="stats-leyenda">
                    <span><span className="stats-sq" style={{ background: "#059669" }}></span>Activas {datos.morosidad.totalActivas ?? 0}</span>
                    <span><span className="stats-sq" style={{ background: "#dc2626" }}></span>Morosas {datos.morosidad.totalMorosas ?? 0}</span>
                  </div>
                  <div className="stats-chart-wrapper stats-chart-dona">
                    <canvas ref={chartMemRef} aria-label="Gráfico membresías activas vs morosas"></canvas>
                  </div>
                </div>
                <div className="stats-card">
                  <p className="stats-card-titulo">Morosidad por estado</p>
                  <div className="stats-chart-wrapper">
                    <canvas ref={chartMorosidadRef} aria-label="Gráfico morosidad por estado"></canvas>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}