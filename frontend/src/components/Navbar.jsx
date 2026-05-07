import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  const closeMenu = () => {
    setOpenMenu(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo" onClick={closeMenu}>
            <div className="logo-mark">C</div>
            <div className="logo-text">
              <span>CODICH</span>
              <small>Gestión de membresías</small>
            </div>
          </Link>

          <ul className="nav-links">
            <li>
              <NavLink to="/" className="nav-btn">
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink to="/membresias" className="nav-btn">
                Membresías
              </NavLink>
            </li>
            <li>
              <NavLink to="/reportes" className="nav-btn">
                Reportes
              </NavLink>
            </li>
            <li>
              <NavLink to="/quienes-somos" className="nav-btn">
                Quiénes somos
              </NavLink>
            </li>
            <li>
              <NavLink to="/historia" className="nav-btn">
                Historia
              </NavLink>
            </li>
            <li>
              <NavLink to="/planes" className="nav-btn">
                Planes
              </NavLink>
            </li>
          </ul>

          <div className="right-buttons">
            <Link to="/acceder" className="access-btn">
              Acceder
            </Link>

            <button className="menu-btn" onClick={() => setOpenMenu(true)}>
              ☰
            </button>
          </div>
        </div>
      </nav>

      <aside className={`side-menu ${openMenu ? "open" : ""}`}>
        <button className="close-btn" onClick={closeMenu}>
          ✕
        </button>

        <NavLink to="/" className="side-link" onClick={closeMenu}>
          Inicio
        </NavLink>
        <NavLink to="/membresias" className="side-link" onClick={closeMenu}>
          Membresías
        </NavLink>
        <NavLink to="/reportes" className="side-link" onClick={closeMenu}>
          Reportes
        </NavLink>
        <NavLink to="/quienes-somos" className="side-link" onClick={closeMenu}>
          Quiénes somos
        </NavLink>
        <NavLink to="/historia" className="side-link" onClick={closeMenu}>
          Historia
        </NavLink>
        <NavLink to="/planes" className="side-link" onClick={closeMenu}>
          Planes
        </NavLink>
        <NavLink to="/acceder" className="side-access-btn" onClick={closeMenu}>
          Acceder
        </NavLink>
      </aside>

      {openMenu && <div className="overlay" onClick={closeMenu}></div>}
    </>
  );
}

export default Navbar;