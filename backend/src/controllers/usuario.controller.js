const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt'); 

// Función para crear un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, rut, fechaNacimiento, email, telefono, profesion, residencia, areaFormacion, rol, password } = req.body;

    if (
      !nombre ||
      !apellido ||
      !rut ||
      !fechaNacimiento ||
      !email ||
      !telefono ||
      !profesion ||
      !residencia ||
      !areaFormacion ||
      !rol
    ) {
      return res.status(400).json({
        error: 'Debes completar todos los campos obligatorios.',
      });
    }

    // Validar que venga contraseña
    if (!password || password.trim() === '') {
      return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    // Verificar si el RUT ya existe
    const usuarioExistente = await Usuario.findOne({ rut });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    // Verificar si el email ya existe
    const emailExistente = await Usuario.findOne({ email });

    if (emailExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    let fechaNacimientoValida;

    if (fechaNacimiento) {
      fechaNacimientoValida = new Date(fechaNacimiento);

      if (Number.isNaN(fechaNacimientoValida.getTime())) {
        return res.status(400).json({
          error: 'La fecha de nacimiento no es válida.',
        });
      }
    }

    // Hashear la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      rut,
      fechaNacimiento: fechaNacimientoValida,
      email,
      telefono,
      profesion,
      residencia,
      areaFormacion,
      rol,
      password: passwordHasheada,
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

// Función para obtener todos los usuarios (Se mantiene igual)
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

// Función para obtener un usuario por RUT (Se mantiene igual)
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

// Función para actualizar un usuario (Modificada opcionalmente para hashear si cambia clave)
const actualizarUsuario = async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre, apellido, email, telefono, profesion, residencia, areaFormacion, rol, password } = req.body;

    const datosActualizados = {};

    if (nombre !== undefined) datosActualizados.nombre = nombre;
    if (apellido !== undefined) datosActualizados.apellido = apellido;
    if (email !== undefined) datosActualizados.email = email;
    if (telefono !== undefined) datosActualizados.telefono = telefono;
    if (profesion !== undefined) datosActualizados.profesion = profesion;
    if (residencia !== undefined) datosActualizados.residencia = residencia;
    if (areaFormacion !== undefined) datosActualizados.areaFormacion = areaFormacion;
    if (rol !== undefined) datosActualizados.rol = rol;

    // Si el usuario envía una nueva contraseña para actualizar, también la hasheamos
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
    }

    const usuarioActualizado = await Usuario.findOneAndUpdate(
      { rut },
      datosActualizados,
      {
        returnDocument: 'after',
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

// Función para eliminar un usuario (Se mantiene igual)
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

// Función para iniciar sesión (Login)
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscamos al usuario por su email
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. COMPARAR LA CONTRASEÑA ENTRANTE CON EL HASH ALMACENADO
    // bcrypt descifra internamente cómo se generó el hash para comprobar si coinciden
    const passwordCoincide = await bcrypt.compare(password, usuario.password);

    if (!passwordCoincide) {
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