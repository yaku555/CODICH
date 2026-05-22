import { Navigate, Outlet } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';

function ProtectedRoute() {
  const { usuario } = useUsuario();

  // Si no hay usuario, mandamos al login
  if (!usuario) {
    return <Navigate to="/acceder" replace />;
  }

  // Si hay usuario, permitimos ver la página (Outlet)
  return <Outlet />;
}

export default ProtectedRoute;