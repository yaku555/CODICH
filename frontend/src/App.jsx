import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import ProtectedRoute from './components/ProtectedRoute';  
import Postulacion from "./pages/Postulacion.jsx";
import Sobre from "./pages/Sobre.jsx";
import Membresias from "./pages/Membresias.jsx";
import Acceder from "./pages/Acceder.jsx";
import PagMiembros from './pages/PagMiembros.jsx'; 
import PagAdmin from "./pages/PagAdmin.jsx";
import Inicio from "./pages/Inicio.jsx";
import Contacto from "./pages/Contacto.jsx";
import "./styles/App.css";


function App() {
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
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;