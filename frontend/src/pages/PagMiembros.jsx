import { useUsuario } from "../context/usuario.context";

function PagMiembros() {
  const { usuario, logout } = useUsuario();

  return (
    <main className="page">
      <h1>Tu Información</h1>
      <p>Nombre: {usuario?.nombre} {usuario?.apellido}</p>
      <p>Email: {usuario?.email}</p>
      <p>Rol: {usuario?.rol}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
}

export default PagMiembros;