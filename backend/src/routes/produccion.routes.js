const express = require('express');
const router = express.Router();
const ProduccionController = require('../controllers/produccion.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Consulta de órdenes de producción y consumos
router.get('/ordenes', ProduccionController.getOrdenes);
router.get('/ordenes/:id', ProduccionController.getOrdenById);
router.get('/ordenes/:id/consumos', ProduccionController.getConsumosByOrden);

// Registro transaccional de consumos (Operarios de planta y Administrador)
router.post(
  '/consumos',
  authorizeRoles('OPERARIO', 'ADMIN'),
  ProduccionController.registrarConsumo
);

module.exports = router;
