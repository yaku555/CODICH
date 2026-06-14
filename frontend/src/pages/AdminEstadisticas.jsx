import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

import {
  getEstadisticasAPI,
  exportarEstadisticasPDFAPI,
} from '../api/estadisticas';

import '../styles/AdminEstadisticas.css';

Chart.register(...registerables);

export default function AdminEstadisticas() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipoReporte, setTipoReporte] = useState('todos');
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [error, setError] = useState(null);

  const chartIngresosRef = useRef(null);
  const chartInscritosRef = useRef(null);
  const chartMorosidadRef = useRef(null);

  const chartIngresosInst = useRef(null);
  const chartInscritosInst = useRef(null);
  const chartMorosidadInst = useRef(null);

  const validarFechas = () => {
    if (desde && hasta && desde > hasta) {
      setError('La fecha desde no puede ser mayor que la fecha hasta.');
      return false;
    }

    return true;
  };

  const generarReportes = async () => {
    if (!validarFechas()) return;

    try {
      setCargando(true);
      setError(null);

      const res = await getEstadisticasAPI({
        desde,
        hasta,
        tipoReporte,
      });

      setData(res);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        setError('Acceso denegado');
      } else {
        setError('No se pudieron generar los reportes estadísticos.');
      }
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = async () => {
    if (!validarFechas()) return;

    try {
      setExportandoPDF(true);
      setError(null);

      const blob = await exportarEstadisticasPDFAPI({
        desde,
        hasta,
        tipoReporte,
      });

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reportes-estadisticos-codich.pdf');
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        setError('Acceso denegado');
      } else {
        setError('No se pudo exportar el reporte en PDF.');
      }
    } finally {
      setExportandoPDF(false);
    }
  };

  const formatearMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
    });
  };

  const mostrarReporte = (nombre) => {
    return tipoReporte === 'todos' || tipoReporte === nombre;
  };

  useEffect(() => {
    chartIngresosInst.current?.destroy();
    chartInscritosInst.current?.destroy();
    chartMorosidadInst.current?.destroy();

    if (cargando || !data || !data.hayRegistros) return;

    if (
      chartIngresosRef.current &&
      data.ingresos?.ingresosPorTipo?.length > 0
    ) {
      chartIngresosInst.current = new Chart(chartIngresosRef.current, {
        type: 'bar',
        data: {
          labels: data.ingresos.ingresosPorTipo.map(
            (item) => item._id || 'Sin tipo'
          ),
          datasets: [
            {
              label: 'Ingresos',
              data: data.ingresos.ingresosPorTipo.map((item) => item.total),
              backgroundColor: '#1e5fa8',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    if (
      chartInscritosRef.current &&
      data.nuevosInscritos?.inscritosPorPlan?.length > 0
    ) {
      chartInscritosInst.current = new Chart(chartInscritosRef.current, {
        type: 'bar',
        data: {
          labels: data.nuevosInscritos.inscritosPorPlan.map(
            (item) => item._id || 'Sin plan'
          ),
          datasets: [
            {
              label: 'Nuevos inscritos',
              data: data.nuevosInscritos.inscritosPorPlan.map(
                (item) => item.cantidad
              ),
              backgroundColor: '#1e5fa8',
              borderRadius: 4,
              barPercentage: 0.45,
              categoryPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    if (
      chartMorosidadRef.current &&
      data.morosidad?.morosidadPorEstado?.length > 0
    ) {
      chartMorosidadInst.current = new Chart(chartMorosidadRef.current, {
        type: 'doughnut',
        data: {
          labels: data.morosidad.morosidadPorEstado.map(
            (item) => item._id || 'Sin estado'
          ),
          datasets: [
            {
              data: data.morosidad.morosidadPorEstado.map(
                (item) => item.cantidad
              ),
              backgroundColor: ['#1e5fa8', '#c47a18', '#b52c2c', '#555'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }

    return () => {
      chartIngresosInst.current?.destroy();
      chartInscritosInst.current?.destroy();
      chartMorosidadInst.current?.destroy();
    };
  }, [data, cargando]);

  return (
    <div className="estadisticas-page">
      <div className="estadisticas-header">
        <h2>Reportes estadísticos</h2>
        <p>
          Genera reportes separados de ingresos, nuevos inscritos y tasa de
          morosidad.
        </p>
      </div>

      <div className="card filtros-card">
        <div className="filtros-grid">
          <div className="filtro-campo">
            <label>Fecha desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>

          <div className="filtro-campo">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>

          <div className="filtro-campo">
            <label>Tipo de reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
            >
              <option value="todos">Todos los reportes</option>
              <option value="ingresos">Ingresos</option>
              <option value="inscritos">Nuevos inscritos</option>
              <option value="morosidad">Tasa de morosidad</option>
            </select>
          </div>

          <button
            type="button"
            className="btn-filtrar"
            onClick={generarReportes}
            disabled={cargando || exportandoPDF}
          >
            {cargando ? 'Generando...' : 'Generar reportes'}
          </button>

          <button
            type="button"
            className="btn-filtrar btn-exportar"
            onClick={exportarPDF}
            disabled={cargando || exportandoPDF}
          >
            {exportandoPDF ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!data && !error && (
        <div className="sin-registros-box">
          <p>
            Selecciona un rango de fechas y un tipo de reporte para generar la
            información.
          </p>
        </div>
      )}

      {data && !data.hayRegistros && (
        <div className="sin-registros-box">
          <p>Sin registros para los filtros seleccionados.</p>
        </div>
      )}

      {data && data.hayRegistros && (
        <>
          <div className="resumen-grid">
            {mostrarReporte('ingresos') && data.ingresos && (
              <div className="card-mini success">
                <h4>Total ingresos</h4>
                <p className="valor">
                  {formatearMoneda(data.ingresos.totalIngresos)}
                </p>
              </div>
            )}

            {mostrarReporte('inscritos') && data.nuevosInscritos && (
              <div className="card-mini">
                <h4>Nuevos inscritos</h4>
                <p className="valor">
                  {data.nuevosInscritos.totalNuevosInscritos || 0}
                </p>
              </div>
            )}

            {mostrarReporte('morosidad') && data.morosidad && (
              <div className="card-mini danger">
                <h4>Tasa de morosidad</h4>
                <p className="valor">
                  {data.morosidad.tasaMorosidad || 0}%
                </p>
              </div>
            )}
          </div>

          <div className="graficos-grid">
            {mostrarReporte('ingresos') &&
              data.ingresos?.ingresosPorTipo?.length > 0 && (
                <div className="card">
                  <h3>Ingresos por tipo de pago</h3>
                  <div className="chart-container">
                    <canvas ref={chartIngresosRef}></canvas>
                  </div>
                </div>
              )}

            {mostrarReporte('inscritos') &&
              data.nuevosInscritos?.inscritosPorPlan?.length > 0 && (
                <div className="card">
                  <h3>Nuevos inscritos por plan</h3>
                  <div className="chart-container">
                    <canvas ref={chartInscritosRef}></canvas>
                  </div>
                </div>
              )}

            {mostrarReporte('morosidad') &&
              data.morosidad?.morosidadPorEstado?.length > 0 && (
                <div className="card">
                  <h3>Distribución de membresías por estado</h3>
                  <div className="chart-container">
                    <canvas ref={chartMorosidadRef}></canvas>
                  </div>
                </div>
              )}
          </div>

          {mostrarReporte('ingresos') && data.ingresos && (
            <div className="card tabla-card">
              <h3>Reporte de ingresos</h3>

              <table className="tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cantidad de pagos</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {data.ingresos.ingresosPorTipo?.map((item) => (
                    <tr key={item._id || 'sin-tipo'}>
                      <td>{item._id || 'Sin tipo'}</td>
                      <td>{item.cantidadPagos}</td>
                      <td>{formatearMoneda(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mostrarReporte('inscritos') && data.nuevosInscritos && (
            <div className="card tabla-card">
              <h3>Reporte de nuevos inscritos</h3>

              <table className="tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>

                <tbody>
                  {data.nuevosInscritos.inscritosPorPlan?.map((item) => (
                    <tr key={item._id || 'sin-plan'}>
                      <td>{item._id || 'Sin plan'}</td>
                      <td>{item.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mostrarReporte('morosidad') && data.morosidad && (
            <div className="card tabla-card">
              <h3>Reporte de tasa de morosidad</h3>

              <table className="tabla-estadisticas">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>

                <tbody>
                  {data.morosidad.morosidadPorEstado?.map((item) => (
                    <tr key={item._id || 'sin-estado'}>
                      <td>{item._id || 'Sin estado'}</td>
                      <td>{item.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}