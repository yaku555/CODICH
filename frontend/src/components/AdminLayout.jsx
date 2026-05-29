import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../styles/AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/acceder');
  };

  return (
    <main className="admin-layout">
      <section className="admin-header">
        <div>
          <p className="admin-subtitle">Panel de administración</p>
          <h1 className="admin-title">Administración CODICH</h1>
        </div>

        <button className="admin-logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </section>

      <nav className="admin-navbar">
        <NavLink
          to="/admin/usuarios"
          className={({ isActive }) =>
            isActive ? 'admin-nav-link active' : 'admin-nav-link'
          }
        >
          Usuarios
        </NavLink>

        <NavLink
          to="/admin/postulaciones"
          className={({ isActive }) =>
            isActive ? 'admin-nav-link active' : 'admin-nav-link'
          }
        >
          Postulaciones
        </NavLink>

        <NavLink
          to="/admin/auditoria"
          className={({ isActive }) =>
            isActive ? 'admin-nav-link active' : 'admin-nav-link'
          }
        >
          Auditoría
        </NavLink>

        <NavLink
          to="/admin/pagos"
          className={({ isActive }) =>
            isActive ? 'admin-nav-link active' : 'admin-nav-link'
          }
        >
          Pagos
        </NavLink>
      </nav>

      <section className="admin-content">
        <Outlet />
      </section>
    </main>
  );
}

export default AdminLayout;