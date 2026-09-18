const ProductoModel = require('../models/producto.model');

/**
 * Controlador del Catálogo de Productos Terminados
 */
class ProductosController {
  /**
   * GET /api/v1/productos
   */
  static async getAll(req, res, next) {
    try {
      const productos = await ProductoModel.getAll();
      res.status(200).json({
        success: true,
        data: productos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/productos/:id
   */
  static async getById(req, res, next) {
    try {
      const producto = await ProductoModel.findById(req.params.id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          error: 'Producto terminado no encontrado',
        });
      }
      res.status(200).json({
        success: true,
        data: producto,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductosController;
