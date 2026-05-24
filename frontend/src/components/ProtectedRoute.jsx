import { Navigate, Outlet } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';

function ProtectedRoute({ rolesPermitidos }) {
  const { usuario } = useUsuario();

  if (!usuario) {
    return <Navigate to="/acceder" replace />;
  }

  const rolUsuario = usuario.rol?.toLowerCase().trim();

  if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
    return <Navigate to="/acceder" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;