export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario, loading, logout }}>
      {children}
    </UsuarioContext.Provider>
  );
}