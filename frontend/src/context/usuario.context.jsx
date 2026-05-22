import { createContext, useContext, useEffect, useState } from 'react';
import { getUsuarios } from '../api/usuarios';

const UsuarioContext = createContext();

export function UsuarioProvider({ children }) {
  const [usuarioPrueba, setUsuarioPrueba] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setLoading(true);
        const usuarios = await getUsuarios();

        if (usuarios.length > 0) {
          setUsuarioPrueba(usuarios[0]);
        }
        
        // Cargar usuario autenticado desde localStorage
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error cargando usuario de prueba:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuario();
  }, []);

  const logout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <UsuarioContext.Provider value={{ usuarioPrueba, usuario, setUsuario, loading, error, logout }}>
      {children}
    </UsuarioContext.Provider>
  );
}

// Hook personalizado
export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  }
  return context;
}