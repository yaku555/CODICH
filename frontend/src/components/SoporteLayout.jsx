import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../styles/SoporteLayout.css';

function SoporteLayout() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/acceder');
  };

  return (
    <div className="soporte-layout">
      <aside className="soporte-sidebar">
        <div className="soporte-brand">
          <span className="soporte-subtitulo">Panel de soporte técnico</span>
          <h2>CODICH</h2>
        </div>

        <nav className="soporte-nav">
          <NavLink
            to="/soporte/logs"
            className={({ isActive }) =>
              isActive ? 'soporte-nav-link active' : 'soporte-nav-link'
            }
          >
            Logs
          </NavLink>

          <NavLink
            to="/soporte/backups"
            className={({ isActive }) =>
              isActive ? 'soporte-nav-link active' : 'soporte-nav-link'
            }
          >
            Backups
          </NavLink>
        </nav>

        <button className="soporte-logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="soporte-main">
        <Outlet />
      </main>
    </div>
  );
}

export default SoporteLayout;