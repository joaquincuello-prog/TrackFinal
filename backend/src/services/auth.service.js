const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const UsuarioModel = require('../models/usuario.model');

/**
 * Servicio de Autenticación y Emisión de Tokens JWT
 */
class AuthService {
  /**
   * Autentica un usuario verificando hash bcrypt y genera el JWT de sesión.
   * @param {string} email
   * @param {string} password
   */
  static async login(email, password) {
    if (!email || !password) {
      const error = new Error('Se requiere email y contraseña');
      error.statusCode = 400;
      throw error;
    }

    const usuario = await UsuarioModel.findByEmail(email);

    if (!usuario) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    if (!usuario.activo) {
      const error = new Error('El usuario se encuentra desactivado');
      error.statusCode = 403;
      throw error;
    }

    // Comparar contraseña con el hash (compatible con crypt pgcrypto)
    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Payload de sesión para el token JWT
    const payload = {
      id: usuario.id,
      email: usuario.email,
      legajo: usuario.legajo,
      rol: usuario.rol,
      nombre: `${usuario.nombre} ${usuario.apellido}`,
    };

    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        legajo: usuario.legajo,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  /**
   * Obtiene la información del usuario autenticado actual.
   * @param {number} id
   */
  static async getPerfil(id) {
    const usuario = await UsuarioModel.findById(id);
    if (!usuario) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return usuario;
  }
}

module.exports = AuthService;
