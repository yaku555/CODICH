import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getEstadisticasAPI } from '../api/estadisticas';
import './AdminEstadisticas.css';

Chart.register(...registerables);

export default function AdminEstadisticas() {
  const [desde, setDesde]       = useState('');
  const [hasta, setHasta]       = useState('');
  const [metrica, setMetrica]   = useState('todos');
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  // Referencias para los lienzos de Chart.js
  const chartSociosRef = useRef(null);
  const chartPostRef   = useRef(null);
  
  // Instancias para poder destruirlos antes de redibujar (evita bugs visuales)
  const chartSociosInst = useRef(null);
  const chartPostInst   = useRef(null);

  // 1. FUNCIÓN PARA LOS FILTROS (Cuando el usuario hace clic en el botón manualmente)
  const manejarFiltrosManuales = async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await getEstadisticasAPI({ desde, hasta, metrica });
      setData(res);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las estadísticas de gestión.');
    } finally {
      setCargando(false);
    }
  };

  // 2. CARGA INICIAL AUTOMÁTICA (Declarada adentro para evitar bucles y errores de linter)
  useEffect(() => {
    async function cargarDataInicial() {
      try {
        setCargando(true);
        setError(null);
        const res = await getEstadisticasAPI({ desde: '', hasta: '', metrica: 'todos' });
        setData(res);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas de gestión.');
      } finally {
        setCargando(false);
      }
    }
    cargarDataInicial();
  }, []);

  // 3. RENDERIZACIÓN INTERACTIVA DE GRÁFICOS
  useEffect(() => {
    if (cargando || !data || !data.hayRegistros) return;

    // 📈 Gráfico de Barras: Socios por Profesión
    if (chartSociosRef.current && data.sociosPorProfesion?.length > 0) {
      chartSociosInst.current?.destroy();
      chartSociosInst.current = new Chart(chartSociosRef.current, {
        type: 'bar',
        data: {
          labels: data.sociosPorProfesion.map(p => p._id || 'Sin Especificar'),
          datasets: [{
            label: 'Cantidad de Socios',
            data: data.sociosPorProfesion.map(p => p.cantidad),
            backgroundColor: '#1e5fa8',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 🍩 Gráfico de Dona: Postulaciones por Estado
    if (chartPostRef.current && data.postulacionesPorEstado?.length > 0) {
      chartPostInst.current?.destroy();
      chartPostInst.current = new Chart(chartPostRef.current, {
        type: 'doughnut',
        data: {
          labels: data.postulacionesPorEstado.map(e => e._id.toUpperCase()),
          datasets: [{
            data: data.postulacionesPorEstado.map(e => e.cantidad),
            backgroundColor: ['#1e5fa8', '#c47a18', '#b52c2c'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    return () => {
      chartSociosInst.current?.destroy();
      chartPostInst.current?.destroy();
    };
  }, [data, cargando]);

  return (
    <div className="estadisticas-page">
      <div className="estadisticas-header">
        <h2>📊 Estadísticas de Gestión Escolar</h2>
        <p>Consulta indicadores comerciales y operativos en tiempo real.</p>
      </div>

      {/* 🛠️ BARRA DE FILTROS OBLIGATORIOS POR RÚBRICA */}
      <div className="card filtros-card">
        <div className="filtros-grid">
          <div className="filtro-campo">
            <label>Fecha Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="filtro-campo">
            <label>Fecha Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div className="filtro-campo">
            <label>Tipo de Métrica</label>
            <select value={metrica} onChange={e => setMetrica(e.target.value)}>
              <option value="todos">Todas las métricas</option>
              <option value="socios">Socios y Profesiones</option>
              <option value="membresias">Vigencia de Membresías</option>
              <option value="postulaciones">Flujo de Postulaciones</option>
            </select>
          </div>
          <button className="btn-filtrar" onClick={manejarFiltrosManuales} disabled={cargando}>
            {cargando ? 'Buscando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* 🚨 CRITERIO EXIGIDO: Mensaje "Sin registros" si la consulta viene vacía */}
      {data && !data.hayRegistros && (
        <div className="sin-registros-box">
          <p>⚠️ Sin registros para el rango de fechas seleccionado</p>
        </div>
      )}

      {/* DESPLIEGUE DE INDICADORES CUANDO SÍ HAY DATA */}
      {data && data.hayRegistros && (
        <>
          {/* Tarjetas Resumen */}
          <div className="resumen-grid">
            <div className="card-mini">
              <h4>Total Socios</h4>
              <p className="valor">{data.totalSocios || 0}</p>
            </div>
            <div className="card-mini success">
              <h4>Membresías Vigentes</h4>
              <p className="valor">{data.membresiasVigentes || 0}</p>
            </div>
            <div className="card-mini danger">
              <h4>Membresías Vencidas</h4>
              <p className="valor">{data.membresiasVencidas || 0}</p>
            </div>
          </div>

          {/* Contenedores de Gráficos de Chart.js */}
          <div className="graficos-grid">
            {data.sociosPorProfesion?.length > 0 && (
              <div className="card">
                <h3>Socios por Profesión / Ocupación</h3>
                <div className="chart-container">
                  <canvas ref={chartSociosRef}></canvas>
                </div>
              </div>
            )}

            {data.postulacionesPorEstado?.length > 0 && (
              <div className="card">
                <h3>Distribución de Postulaciones</h3>
                <div className="chart-container">
                  <canvas ref={chartPostRef}></canvas>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}