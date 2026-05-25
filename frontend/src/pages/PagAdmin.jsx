// frontend/src/pages/PagAdmin.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsuarios } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function PagAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `${usuario.nombre} ${usuario.apellido} ${usuario.rut} ${usuario.email} ${usuario.rol}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando usuarios...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Panel de administración</p>
          <h1>Usuarios registrados</h1>
        </div>

        <div className="admin-contador">
          {usuarios.length} usuarios
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT, email o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {error && <p className="admin-error">{error}</p>}

        {usuariosFiltrados.length === 0 ? (
          <p className="admin-vacio">No se encontraron usuarios.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id || usuario.rut}>
                    <td>
                      <strong>
                        {usuario.nombre} {usuario.apellido}
                      </strong>
                    </td>

                    <td>{usuario.rut}</td>
                    <td>{usuario.email}</td>

                    <td>
                      <span className={`rol-badge rol-${usuario.rol?.toLowerCase()}`}>
                        {usuario.rol}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/admin/usuarios/${encodeURIComponent(usuario.rut)}`}
                        className="btn-ver"
                      >
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PagAdmin;