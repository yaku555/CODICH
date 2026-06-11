import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import { registrarLog } from '../api/auditoria';

function normalizarRol(rol) {
  return rol?.toString().toLowerCase().trim();
}

function obtenerNombreUsuario(usuario) {
  if (!usuario) return 'No autenticado';

  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

  if (nombreCompleto) {
    return `${nombreCompleto} (${usuario.email || usuario.rut || usuario.rol || 'sin identificador'})`;
  }

  return usuario.email || usuario.rut || usuario.rol || 'Usuario desconocido';
}

function obtenerFuncionalidadPorRuta(pathname) {
  const rutas = {
    '/admin': 'Panel de administración',
    '/admin/crear': 'Crear usuario',
    '/admin/postulaciones': 'Gestión de postulaciones',
    '/admin/auditoria': 'Logs de auditoría',
    '/admin/pagos': 'Gestión de pagos',
    '/admin/estadisticas': 'Estadísticas administrativas',
    '/miembros': 'Panel de miembros',
    '/soporte': 'Panel de soporte técnico',
    '/soporte/logs': 'Logs de soporte técnico',
    '/soporte/backups': 'Backups de soporte técnico',
  };

  const rutaExacta = rutas[pathname];

  if (rutaExacta) {
    return rutaExacta;
  }

  if (pathname.startsWith('/admin/usuarios/')) {
    return 'Detalle de usuario';
  }

  if (pathname.startsWith('/admin/postulaciones/')) {
    return 'Detalle de postulación';
  }

  if (pathname.startsWith('/soporte/logs')) {
    return 'Logs de soporte técnico';
  }

  if (pathname.startsWith('/soporte/backups')) {
    return 'Backups de soporte técnico';
  }

  return `Ruta protegida: ${pathname}`;
}

function obtenerModuloPorRuta(pathname) {
  if (pathname.startsWith('/soporte')) return 'Soporte';
  if (pathname.includes('/postulaciones')) return 'Postulaciones';
  if (pathname.includes('/pagos')) return 'Pagos';
  if (pathname.includes('/auditoria')) return 'Admin';
  if (pathname.includes('/miembros')) return 'Socios';

  return 'Admin';
}

function ProtectedRoute({ rolesPermitidos = [] }) {
  const { usuario, loading } = useUsuario();
  const location = useLocation();

  const rolUsuario = normalizarRol(usuario?.rol);
  const rolesNormalizados = rolesPermitidos.map((rol) => normalizarRol(rol));

  const tienePermiso =
    rolesNormalizados.length === 0 || rolesNormalizados.includes(rolUsuario);

  const debeRegistrarIntento =
    !loading && (!usuario || !tienePermiso);

  useEffect(() => {
    if (!debeRegistrarIntento) return;

    const funcionalidadIntentada = obtenerFuncionalidadPorRuta(location.pathname);
    const modulo = obtenerModuloPorRuta(location.pathname);
    const nombreUsuario = obtenerNombreUsuario(usuario);

    registrarLog({
      nivel: 'WARN',
      modulo,
      usuario: nombreUsuario,
      descripcion: `Intento de acceso no autorizado. Funcionalidad intentada: ${funcionalidadIntentada}. Ruta: ${location.pathname}. Rol del usuario: ${
        rolUsuario || 'sin sesión'
      }. Roles permitidos: ${
        rolesNormalizados.length > 0 ? rolesNormalizados.join(', ') : 'sin restricción'
      }.`,
    }).catch((error) => {
      console.error('No se pudo registrar el intento no autorizado:', error);
    });
  }, [
    debeRegistrarIntento,
    usuario,
    location.pathname,
    rolUsuario,
    rolesNormalizados,
  ]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/acceder"
        replace
        state={{
          from: location.pathname,
          requiereLogin: true,
          mensaje: 'Debes iniciar sesión para acceder',
        }}
      />
    );
  }

  if (!tienePermiso) {
    return (
      <Navigate
        to="/acceder"
        replace
        state={{
          from: location.pathname,
          accesoDenegado: true,
          mensaje: 'Acceso denegado',
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;