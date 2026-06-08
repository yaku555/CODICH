import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import ProtectedRoute from "./components/ProtectedRoute";

import Postulacion from "./pages/Postulacion.jsx";
import Sobre from "./pages/Sobre.jsx";
import Membresias from "./pages/Membresias.jsx";
import Acceder from "./pages/Acceder.jsx";
import PagMiembros from "./pages/PagUsuario.jsx";
import PagAdmin from "./pages/PagAdmin.jsx";
import Inicio from "./pages/Inicio.jsx";
import Contacto from "./pages/Contacto.jsx";
import AdminUsuarioDetalle from "./pages/AdminUsuarioDetalle";
import AdminCrear from "./pages/AdminCrear.jsx";
import PagePostulacionAdmin from "./pages/PageAdminPostulaciones.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AuditoriaDashboard from "./pages/AuditoriaDashboard.jsx";
import AdminPagos from "./pages/AdminPagos.jsx";
import Pagar from "./pages/Pagar.jsx";
import ResultadoPago from "./pages/ResultadoPago.jsx";
import AdminPostulacionDetalle from "./pages/AdminPostulacionDetalle.jsx";

import "./styles/App.css";

function App() {
  return (
    <>
      <Navbar />

      <div className="app-content">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Inicio />} />
          <Route path="/acceder" element={<Acceder />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/membresias" element={<Membresias />} />
          <Route path="/postulacion" element={<Postulacion />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/pagar" element={<Pagar />} />
          <Route path="/pago/resultado" element={<ResultadoPago />} />

          {/* Rutas protegidas de usuario */}
          <Route element={<ProtectedRoute rolesPermitidos={["usuario"]} />}>
            <Route path="/perfil" element={<PagMiembros />} />
          </Route>

          {/* Rutas protegidas de admin */}
          <Route
            element={
              <ProtectedRoute rolesPermitidos={["admin", "administrador"]} />
            }
          >
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="usuarios" element={<PagAdmin />} />
              <Route path="usuarios/:rut" element={<AdminUsuarioDetalle />} />
              <Route path="crear" element={<AdminCrear />} />
              <Route path="postulaciones" element={<PagePostulacionAdmin />} />
              <Route path="/admin/postulaciones/:rut" element={<AdminPostulacionDetalle />} />
              <Route path="auditoria" element={<AuditoriaDashboard />} />
              <Route path="pagos" element={<AdminPagos />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;