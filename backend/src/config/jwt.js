require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'trackfinal_jwt_default_secret_key_lacteos_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h', // Turno de 8 horas en planta
};
