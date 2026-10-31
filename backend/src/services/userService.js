const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT firmado
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    },
    process.env.JWT_SECRET || 'secret_fallback_key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );
};

class UserService {
  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error('El correo electrónico ya se encuentra registrado');
      error.statusCode = 400;
      throw error;
    }

    const newUser = await User.create(userData);
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
   */
  async update(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error(`Usuario con id '${id}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    // Si viene password, asignamos para que el pre-save hook lo hashee
    if (updateData.password) {
      user.password = updateData.password;
    }
    if (updateData.nombre) user.nombre = updateData.nombre;
    if (updateData.telNumber !== undefined) user.telNumber = updateData.telNumber;
    if (updateData.fechaNacimiento !== undefined) user.fechaNacimiento = updateData.fechaNacimiento;
    if (updateData.genero !== undefined) user.genero = updateData.genero;
    if (updateData.rol !== undefined) user.rol = updateData.rol;

    await user.save();
    return user;
  }

  /**
   * Eliminar usuario
   */
  async delete(id) {
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

