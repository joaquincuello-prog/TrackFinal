const AuthService = require('../services/auth.service');

/**
 * Controlador de Autenticación
 */
class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Autenticación exitosa',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const perfil = await AuthService.getPerfil(req.usuario.id);

      res.status(200).json({
        success: true,
        data: {
          id: perfil.id,
          nombre: `${perfil.nombre} ${perfil.apellido}`,
          legajo: perfil.legajo,
          email: perfil.email,
          rol: perfil.rol,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
