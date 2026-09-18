/**
 * Middleware para autorización basada en roles (RBAC).
 * Permite restringir el acceso a uno o varios roles autorizados (ADMIN, SUPERVISOR, OPERARIO, AUDITOR).
 * 
 * @param {...string} rolesPermitidos - Lista de nombres de roles permitidos
 */
const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: identidad de usuario no verificada.',
      });
    }

    const tienePermiso = rolesPermitidos.includes(req.usuario.rol);

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: el rol '${req.usuario.rol}' no tiene permisos para realizar esta operación. Roles requeridos: [${rolesPermitidos.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
