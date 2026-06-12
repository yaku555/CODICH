import '../styles/Comprobantes.css';
import { descargarComprobantePago } from '../api/pagos';

const formatMonto = (monto) => {
    return Number(monto || 0).toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
    });
};

const formatFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    return new Date(fecha).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',

    });
};

const descargarPDF = async (pago) => {
    try {
        const blob = await descargarComprobantePago(pago._id);

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-${pago.ordenCompra}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('No se pudo descargar el comprobante.');
    }
};
function Comprobantes({ comprobante, cerrar }) {
    if (!comprobante) return null;

    const pagos = Array.isArray(comprobante.pagos) ? comprobante.pagos : [];

    return (
        <div className="detalle-overlay">
            <div className="detalle-panel">
                <button className="btn-cerrar-detalle" onClick={cerrar}>
                    ×
                </button>

                <div className="detalle-documento">
                    <div className="detalle-header">
                        <div>
                            <h2>Comprobantes de pago</h2>
                            <p className="detalle-fecha">
                                Membresía: {comprobante.codigoMembresia || 'Sin código'}
                            </p>
                        </div>

                        <span className="detalle-estado">
                            {comprobante.estado}
                        </span>
                    </div>

                    <section className="detalle-section">
                        <h3>Pagos asociados</h3>

                        {pagos.length === 0 ? (
                            <p>No hay pagos autorizados asociados a esta membresía.</p>
                        ) : (
                            <div className="comprobantes-lista">
                                {pagos.map((pago, index) => (
                                    <div key={pago._id} className="comprobante-item">
                                        <h4>Pago #{index + 1} | {formatFecha(pago.fechaConfirmacion)}</h4>

                                        <p>Orden: {pago.ordenCompra}</p>
                                        <p>Tipo: {pago.tipo}</p>
                                        <p>Estado: {pago.estado}</p>
                                        <p>Monto: {formatMonto(pago.monto)}</p>
                                        <button
                                            className   ="btn-exportar-pdf"
                                            onClick={() => descargarPDF(pago)}>
                                            Descargar PDF
                                        </button>

                                    </div>

                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
export default Comprobantes;