import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import ProtectedRoute from './components/ProtectedRoute';

import Postulacion from "./pages/Postulacion.jsx";
import Sobre from "./pages/Sobre.jsx";
import Membresias from "./pages/Membresias.jsx";
import Acceder from "./pages/Acceder.jsx";
import PagMiembros from './pages/PagUsuario.jsx';
import PagAdmin from "./pages/PagAdmin.jsx";
import Inicio from "./pages/Inicio.jsx";
import Contacto from "./pages/Contacto.jsx";
import AdminUsuarioDetalle from './pages/AdminUsuarioDetalle';
import AdminCrear from './pages/AdminCrear.jsx';
import PagePostulacionAdmin from './pages/PageAdminPostulaciones.jsx';

import { useUsuario } from "./context/usuario.context";

import "./styles/App.css";

function App() {
  const { usuario, loading } = useUsuario();

  return (
    <>
      <Navbar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/acceder" element={<Acceder />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/membresias" element={<Membresias />} />
          <Route path="/postulacion" element={<Postulacion />} />
          <Route element={<ProtectedRoute rolesPermitidos={["usuario"]} />}>
            <Route path="/miembros" element={<PagMiembros />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={["admin", "administrador"]} />}>
            <Route path="/admin" element={<PagAdmin />} />
            <Route path="/admin/usuarios/:rut" element={<AdminUsuarioDetalle />} />
            <Route path="/admin/crear" element={<AdminCrear />} />
            <Route path="/admin/postulaciones" element={<PagePostulacionAdmin />} />
          </Route>

          <Route path="/contacto" element={<Contacto />} />
        </Routes>
      </div>
    </>
  );
}

export default App;