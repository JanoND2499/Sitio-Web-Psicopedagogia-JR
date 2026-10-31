const mongoose = require('mongoose');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT firmado
 */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET no está configurada en las variables de entorno');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );
};

class UserService {
  /**
   * Registro de nuevo usuario (Registro público)
   * REGLA DE SEGURIDAD: Siempre asigna rol 'paciente' ignorando cualquier rol enviado externamente.
   */
  async register(userData) {
    if (!userData.email || !userData.password || !userData.nombre) {
      const error = new Error('Nombre, email y contraseña son campos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email: userData.email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error('El correo electrónico ya se encuentra registrado');
      error.statusCode = 400;
      throw error;
    }

    // Sanitización de seguridad: se fuerza el rol 'paciente' y se descarta cualquier rol recibido
    const safeUserData = {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      rol: 'paciente',
    };

    const newUser = await User.create(safeUserData);
    const token = generateToken(newUser);

    return {
      user: newUser,
      token,
    };
  }

  /**
   * Inicio de sesión / Login con generación de JWT
   */
  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Debe proporcionar email y contraseña');
      error.statusCode = 400;
      throw error;
    }

    // Buscamos el usuario por email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const error = new Error('Credenciales inválidas: correo no registrado');
      error.statusCode = 401;
      throw error;
    }

    // Comparamos contraseña con bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Credenciales inválidas: contraseña incorrecta');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);
    return {
      user,
      token,
    };
  }

  /**
   * Obtener todos los usuarios
   */
  async getAll() {
    return await User.find().sort({ createdAt: -1 });
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(id);
    if (!user) {
      const error = new Error(`Usuario con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Actualizar usuario
   * REGLAS DE SEGURIDAD:
   * - Solo el propio usuario o un admin pueden modificar la cuenta.
   * - Solo un admin puede modificar el campo 'rol'.
   */
  async update(id, updateData, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (currentUser) {
      // Un usuario común no puede modificar la cuenta de otro usuario
      if (currentUser.rol !== 'admin' && String(currentUser.id) !== String(id)) {
        const error = new Error('Acceso denegado: No tiene permisos para modificar la cuenta de otro usuario');
        error.statusCode = 403;
        throw error;
      }

      // Solo un administrador puede modificar el rol
      if (updateData.rol && currentUser.rol !== 'admin') {
        const error = new Error('Acceso denegado: Solo los administradores pueden modificar el rol de un usuario');
        error.statusCode = 403;
        throw error;
      }
    }

    const user = await User.findById(id);
    if (!user) {
      const error = new Error(`Usuario con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    // Si viene password, asignamos para que el pre-save hook lo hashee con bcrypt
    if (updateData.password) {
      user.password = updateData.password;
    }
    if (updateData.nombre) user.nombre = updateData.nombre;
    if (updateData.telNumber !== undefined) user.telNumber = updateData.telNumber;
    if (updateData.fechaNacimiento !== undefined) user.fechaNacimiento = updateData.fechaNacimiento;
    if (updateData.genero !== undefined) user.genero = updateData.genero;
    if (updateData.rol !== undefined && (!currentUser || currentUser.rol === 'admin')) {
      user.rol = updateData.rol;
    }

    await user.save();
    return user;
  }

  /**
   * Eliminar usuario
   * REGLAS DE SEGURIDAD:
   * - Solo el propio usuario o un admin pueden eliminar la cuenta.
   */
  async delete(id, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(`El formato del ID '${id}' no es válido`);
      error.statusCode = 400;
      throw error;
    }

    if (currentUser) {
      if (currentUser.rol !== 'admin' && String(currentUser.id) !== String(id)) {
        const error = new Error('Acceso denegado: No tiene permisos para eliminar la cuenta de otro usuario');
        error.statusCode = 403;
        throw error;
      }
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      const error = new Error(`Usuario con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Usuario eliminado exitosamente', id };
  }
}

module.exports = new UserService();
