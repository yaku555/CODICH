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
              <NavLink to="/sobre" className="nav-btn">
                Sobre
              </NavLink>
            </li>
            <li>
              <NavLink to="/membresias" className="nav-btn">
                Membresías
              </NavLink>
            </li>
            <li>
              <NavLink to="/contacto" className="nav-btn">
                Contacto
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/postulaciones" className="nav-btn">
                Postulación adm
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
        <NavLink to="/sobre" className="side-link" onClick={closeMenu}>
          Sobre
        </NavLink>
        <NavLink to="/membresias" className="side-link" onClick={closeMenu}>
          Membresías
        </NavLink>

        <NavLink to="/contacto" className="side-link" onClick={closeMenu}>
          Contacto
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