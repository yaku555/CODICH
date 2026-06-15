const SoporteTecnico = require('../models/SoporteTecnico');
const bcrypt = require('bcrypt');

const quitarPassword = (soporte) => {
  const soporteSinPassword = soporte.toObject ? soporte.toObject() : soporte;
  delete soporteSinPassword.password;
  return soporteSinPassword;
};

// crear el soporte técnico
const crearSoporteTecnico = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      rut,
      email,
      telefono,
      password,
    } = req.body;

    if (!nombre || !apellido || !rut || !email || !telefono) {
      return res.status(400).json({
        error: 'Debes completar todos los campos obligatorios.',
      });
    }

    if (!password || password.trim() === '') {
      return res.status(400).json({
        error: 'La contraseña es obligatoria.',
      });
    }

    const soportePorRut = await SoporteTecnico.findOne({ rut });

    if (soportePorRut) {
      return res.status(400).json({
        error: 'El RUT ya está registrado.',
      });
    }

    const soportePorEmail = await SoporteTecnico.findOne({ email });

    if (soportePorEmail) {
      return res.status(400).json({
        error: 'El email ya está registrado.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(password, salt);

    const nuevoSoporteTecnico = new SoporteTecnico({
      nombre,
      apellido,
      rut,
      email,
      telefono,
      rol: 'soporte_tecnico',
      password: passwordHasheada,
    });

    const soporteGuardado = await nuevoSoporteTecnico.save();

    res.status(201).json(quitarPassword(soporteGuardado));
  } catch (error) {
    console.error('Error al crear soporte técnico:', error);
    res.status(500).json({
      error: 'Hubo un problema al crear el soporte técnico.',
    });
  }
};

// para obtener todos los soportes tecnicos
const getSoportesTecnicos = async (req, res) => {
  try {
    const soportes = await SoporteTecnico.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(soportes);
  } catch (error) {
    console.error('Error al obtener soportes técnicos:', error);
    res.status(500).json({
      error: 'Hubo un problema al obtener los soportes técnicos.',
    });
  }
};

// Obtener soporte tecnico mediante el rut
const getSoporteTecnicoPorRut = async (req, res) => {
  try {
    const { rut } = req.params;

    const soporte = await SoporteTecnico.findOne({ rut })
      .select('-password')
      .lean();

    if (!soporte) {
      return res.status(404).json({
        error: 'Soporte técnico no encontrado.',
      });
    }

    res.status(200).json(soporte);
  } catch (error) {
    console.error('Error al obtener soporte técnico:', error);
    res.status(500).json({
      error: 'Hubo un problema al obtener el soporte técnico.',
    });
  }
};

// Actualizar el soporte tecnico
const actualizarSoporteTecnico = async (req, res) => {
  try {
    const { rut } = req.params;

    const {
      nombre,
      apellido,
      email,
      telefono,
      password,
    } = req.body;

    const datosActualizados = {};

    if (nombre !== undefined) datosActualizados.nombre = nombre;
    if (apellido !== undefined) datosActualizados.apellido = apellido;
    if (telefono !== undefined) datosActualizados.telefono = telefono;

    if (email !== undefined) {
      const emailExistente = await SoporteTecnico.findOne({
        email,
        rut: { $ne: rut },
      });

      if (emailExistente) {
        return res.status(400).json({
          error: 'El email ya está registrado por otro soporte técnico.',
        });
      }

      datosActualizados.email = email;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
    }

    datosActualizados.rol = 'soporte_tecnico';

    const soporteActualizado = await SoporteTecnico.findOneAndUpdate(
      { rut },
      datosActualizados,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!soporteActualizado) {
      return res.status(404).json({
        error: 'Soporte técnico no encontrado.',
      });
    }

    res.status(200).json(soporteActualizado);
  } catch (error) {
    console.error('Error al actualizar soporte técnico:', error);
    res.status(500).json({
      error: 'Hubo un problema al actualizar el soporte técnico.',
    });
  }
};

// Eliminar el soporte técnico
const borrarSoporteTecnico = async (req, res) => {
  try {
    const { rut } = req.params;

    const soporteEliminado = await SoporteTecnico.findOneAndDelete({ rut });

    if (!soporteEliminado) {
      return res.status(404).json({
        error: 'Soporte técnico no encontrado.',
      });
    }

    res.status(200).json({
      message: 'Soporte técnico eliminado correctamente.',
    });
  } catch (error) {
    console.error('Error al eliminar soporte técnico:', error);
    res.status(500).json({
      error: 'Hubo un problema al eliminar el soporte técnico.',
    });
  }
};

// Login para lo que es el soporte técnico
const loginSoporteTecnico = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son obligatorios.',
      });
    }

    const soporte = await SoporteTecnico.findOne({ email });

    if (!soporte) {
      return res.status(401).json({
        error: 'Credenciales inválidas.',
      });
    }

    const passwordCoincide = await bcrypt.compare(password, soporte.password);

    if (!passwordCoincide) {
      return res.status(401).json({
        error: 'Credenciales inválidas.',
      });
    }

    res.status(200).json(quitarPassword(soporte));
  } catch (error) {
    console.error('Error en login de soporte técnico:', error);
    res.status(500).json({
      error: 'Error en el servidor.',
    });
  }
};

module.exports = {
  crearSoporteTecnico,
  getSoportesTecnicos,
  getSoporteTecnicoPorRut,
  actualizarSoporteTecnico,
  borrarSoporteTecnico,
  loginSoporteTecnico,
};