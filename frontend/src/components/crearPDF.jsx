 import { jsPDF } from "jspdf";

 export default function generarComprobantePDF() {
    const usuarioActual = "test";

    const comprobante = {
      numeroTransaccion: `TX-${Date.now()}`,
      fecha: new Date().toLocaleString("es-CL"),
      monto: "$25.000 CLP",
      metodoPago: "Webpay Plus - Tarjeta de crédito",
      estadoPago: "Pago exitoso",
      estadoSolvencia: "Solvente - Membresía vigente",
      plan: "Membresía Profesional Anual",
      nombreSocio: usuarioActual || "Usuario de prueba",
      apellidoSocio: usuarioActual || "Demo",
      rutSocio: usuarioActual || "12.345.678-9",
      emailSocio: usuarioActual || "usuario.demo@codich.cl",
    };

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Comprobante Digital de Pago", 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Colegio de Diseñadores Instruccionales Chile - CODICH", 20, 30);

    doc.line(20, 36, 190, 36);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Datos del comprobante", 20, 48);

    doc.setFontSize(11);

    const datos = [
      ["Número de transacción:", comprobante.numeroTransaccion],
      ["Fecha:", comprobante.fecha],
      ["Monto pagado:", comprobante.monto],
      ["Método de pago:", comprobante.metodoPago],
      ["Estado del pago:", comprobante.estadoPago],
      ["Estado de solvencia:", comprobante.estadoSolvencia],
      ["Plan:", comprobante.plan],
    ];

    let y = 60;

    datos.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);

      doc.setFont("helvetica", "normal");
      doc.text(value, 75, y);

      y += 10;
    });

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Datos del socio", 20, y);

    y += 12;

    const datosSocio = [
      ["Nombre:", `${comprobante.nombreSocio} ${comprobante.apellidoSocio}`],
      ["RUT:", comprobante.rutSocio],
      ["Correo:", comprobante.emailSocio],
    ];

    datosSocio.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);

      doc.setFont("helvetica", "normal");
      doc.text(value, 75, y);

      y += 10;
    });

    y += 10;

    doc.line(20, y, 190, y);

    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "Este comprobante fue generado automáticamente como respaldo digital del pago realizado. En una versión final, este documento quedará asociado al historial de pagos del miembro dentro del sistema.",
      20,
      y,
      { maxWidth: 170 }
    );

    y += 25;

    doc.setFont("helvetica", "bold");
    doc.text("Estado final:", 20, y);

    doc.setFont("helvetica", "normal");
    doc.text("Comprobante generado correctamente en modo de prueba.", 55, y);

    doc.save(`comprobante-${comprobante.numeroTransaccion}.pdf`);
  };

