const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Middleware para autenticar solicitudes mediante JSON Web Token (JWT) en header Bearer.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: se requiere cabecera Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    // Asignar los datos decodificados a la solicitud (id, email, legajo, rol, nombre)
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'El token de sesión ha expirado. Por favor, inicie sesión nuevamente.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Token de autenticación inválido o corrupto.',
    });
  }
};

module.exports = authenticateToken;
