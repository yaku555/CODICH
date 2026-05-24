const Usuario = require('../models/Usuario');  // Importa el modelo Usuario
const { getUsuarioData } = require('../utils/getDatas.js'); // Función para obtener los datos del usuario

// Función para crear un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, rut, email, rol, password } = req.body;

    // Verificar si el usuario ya existe por RUT
    const usuarioExistente = await Usuario.findOne({ rut });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    // Crear un nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      rut,
      email,
      rol,
      password,
    });

    // Guardar el usuario en la base de datos
    const usuarioGuardado = await nuevoUsuario.save();

    res.status(201).json(usuarioGuardado); // Devuelve el usuario creado
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al crear el usuario' });
  }
};

// Función para obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().lean(); // Obtener todos los usuarios
    res.status(200).json(usuarios); // Devuelve la lista de usuarios
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener los usuarios' });
  }
};


// Función para actualizar un usuario
const actualizarUsuario = async (req, res) => {
  const { rut } = req.params; 
  // CORRECCIÓN: Agregamos 'email' aquí para que esté definido
  const { nombre, apellido, email, rol, password } = req.body;

  try {
    const usuario = await Usuario.findOneAndUpdate(
      { rut },
      { nombre, apellido, email, rol, password }, // Ahora 'email' ya funciona perfectamente
      { new: true }
    );
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario); 
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al actualizar el usuario' });
  }
};

// Función para eliminar un usuario
const borrarUsuario = async (req, res) => {
  const { rut } = req.params;  // Obtener el RUT desde los parámetros de la URL

  try {
    // Buscar y eliminar el usuario por RUT
    const usuario = await Usuario.findOneAndDelete({ rut });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });  // Confirmación de eliminación
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el usuario' });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Aquí deberías comparar con contraseña hasheada (bcrypt)
    if (usuario.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};


// Usamos el controlador base para las funciones CRUD si fuera necesario
const { getById: getUsuarioPorRut} = require('./baseCrud.controller')(Usuario, getUsuarioData, 'rut', 'rut');

module.exports = {
  getUsuarios,          // Función para obtener todos los usuarios
  crearUsuario,         // Función para crear un nuevo usuario
  getUsuarioPorRut,     // Función para obtener un usuario por su RUT
  actualizarUsuario,    // Función para actualizar un usuario por su RUT
  borrarUsuario,        // Función para borrar un usuario por su RUT
  loginUsuario           // Función para iniciar sesión
};


                                                        