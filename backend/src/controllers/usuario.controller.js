const Usuario = require('../models/Usuario');

// Función para crear un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, rut, email, rol, password } = req.body;

    const usuarioExistente = await Usuario.findOne({ rut });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      rut,
      email,
      rol,
      password,
    });

    const usuarioGuardado = await nuevoUsuario.save();

    const usuarioSinPassword = usuarioGuardado.toObject();
    delete usuarioSinPassword.password;

    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al crear el usuario' });
  }
};

// Función para obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('-password')
      .lean();

    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener los usuarios' });
  }
};

// Función para obtener un usuario por RUT
const getUsuarioPorRut = async (req, res) => {
  try {
    const { rut } = req.params;

    const usuario = await Usuario.findOne({ rut })
      .select('-password')
      .lean();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener el usuario' });
  }
};

// Función para actualizar un usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { rut } = req.params;

    const { nombre, apellido, email, rol, password } = req.body;

    const datosActualizados = {
      nombre,
      apellido,
      email,
      rol,
    };

    // Solo cambia la contraseña si el admin escribió una nueva
    if (password && password.trim() !== '') {
      datosActualizados.password = password;
    }

    // Seguridad extra: aunque manden rut desde el frontend, no se actualiza
    delete datosActualizados.rut;

    const usuarioActualizado = await Usuario.findOneAndUpdate(
      { rut },
      datosActualizados,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(usuarioActualizado);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al actualizar el usuario' });
  }
};

// Función para eliminar un usuario
const borrarUsuario = async (req, res) => {
  try {
    const { rut } = req.params;

    const usuario = await Usuario.findOneAndDelete({ rut });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el usuario' });
  }
};

// Función para iniciar sesión
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (usuario.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuarioSinPassword = usuario.toObject();
    delete usuarioSinPassword.password;

    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  getUsuarios,
  crearUsuario,
  getUsuarioPorRut,
  actualizarUsuario,
  borrarUsuario,
  loginUsuario,
};