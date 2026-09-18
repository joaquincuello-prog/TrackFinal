/**
 * Middleware centralizado de gestión de errores HTTP y de base de datos.
 * Normaliza las respuestas de error en formato { success: false, error: string }.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR HANDLER] ${req.method} ${req.originalUrl}:`, err);

  // Error de clave foránea en PostgreSQL (23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Violación de integridad referencial: la entidad foránea referenciada no existe o no puede eliminarse/modificarse.',
      detail: err.detail,
    });
  }

  // Error de clave única duplicada en PostgreSQL (23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Conflicto de unicidad: ya existe un registro con ese identificador o código.',
      detail: err.detail,
    });
  }

  // Error de restricción CHECK en PostgreSQL (23514)
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: `Violación de regla de validación en base de datos: ${err.constraint || err.message}`,
    });
  }

  // Errores con código de estado HTTP explícito
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
