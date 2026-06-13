  import { useState } from "react";
  import { Link, NavLink } from "react-router-dom";
  import { useUsuario } from "../context/usuario.context";
  import "./Navbar.css";

  function Navbar() {
    const [openMenu, setOpenMenu] = useState(false);
    const { usuario, logout } = useUsuario();

    const closeMenu = () => {
      setOpenMenu(false);
    };

    const nombreUsuario =
      usuario?.nombre || usuario?.usuario?.nombre || usuario?.email || "Usuario";

    return (
      <>
        <nav className="navbar">
          <div className="navbar-container">
            <Link to="/" className="logo" onClick={closeMenu}>
              <img className="logo-mark" src="/imgs/codich.png" alt="C" />
            
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
                <NavLink to="/pagar" className="nav-btn">
                  Pagos
                </NavLink>
              </li>
            </ul>

            <div className="right-buttons">
              {usuario ? (
                <>
                  <Link to="/perfil" className="access-btn">
                    Hola, {nombreUsuario}
                  </Link>

                  <button className="access-btn" onClick={logout}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link to="/acceder" className="access-btn">
                  Acceder
                </Link>
              )}

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

          <NavLink to="/pagar" className="side-link" onClick={closeMenu}>
            Pagos
          </NavLink>

          {usuario ? (
            <>
              <NavLink to="/perfil" className="side-access-btn" onClick={closeMenu}>
                Hola, {nombreUsuario}
              </NavLink>

              <button
                className="side-access-btn"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/acceder" className="side-access-btn" onClick={closeMenu}>
              Acceder
            </NavLink>
          )}
        </aside>

        {openMenu && <div className="overlay" onClick={closeMenu}></div>}
      </>
    );
  }

  export default Navbar;