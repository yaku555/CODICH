import { useState } from 'react';
import { loginUsuario } from '../api/usuarios';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context'; 
import { loginSoporteTecnico } from '../api/soporteTecnico';
import Postulacion from './Postulacion.jsx';


function Acceder() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUsuario } = useUsuario(); // ← AGREGAR ESTO

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let usuarioAutenticado = null;

      try {
        usuarioAutenticado = await loginUsuario(email, password);
      } catch (errorUsuario) {
        usuarioAutenticado = await loginSoporteTecnico(email, password);
      }

      setUsuario(usuarioAutenticado);
      localStorage.setItem('usuario', JSON.stringify(usuarioAutenticado));

      const rol = usuarioAutenticado.rol?.toLowerCase().trim();

      if (rol === 'admin' || rol === 'administrador') {
        navigate('/admin');
      } else if (rol === 'soporte_tecnico') {
        navigate('/soporte/logs');
      } else if (rol === 'usuario') {
        navigate('/miembros');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page login-page">
      <div className="login-card">
        <h1>Acceder</h1>
        <p>Ingresa a tu cuenta CODICH.</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
          
          <p>¿No tienes cuenta?{" "}
            <NavLink to="/postulacion">Postula aquí</NavLink>
          </p>

        </form>
      </div>
    </main>
  );
}

export default Acceder;