import { Navigate, Outlet } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';

function normalizarRol(rol) {
  return rol?.toString().toLowerCase().trim();
}

function ProtectedRoute({ rolesPermitidos = [] }) {
  const { usuario, loading } = useUsuario();

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/acceder" replace />;
  }

  const rolUsuario = normalizarRol(usuario.rol);

  const rolesNormalizados = rolesPermitidos.map((rol) =>
    normalizarRol(rol)
  );

  const tienePermiso =
    rolesNormalizados.length === 0 ||
    rolesNormalizados.includes(rolUsuario);

  if (!tienePermiso) {
    return <Navigate to="/acceder" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;