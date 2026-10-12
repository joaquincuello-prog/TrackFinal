const express = require('express');
const router = express.Router();
const LotesPTController = require('../controllers/lotesPT.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Consulta de lotes PT
router.get('/', LotesPTController.getAll);
router.get('/:codigo', LotesPTController.getByCodigo);
router.get('/:codigo/qr', LotesPTController.getQR);

// Alta atómica de nuevo lote PT con QR (Solo Operarios de planta y Administrador)
router.post(
  '/',
  authorizeRoles('OPERARIO', 'ADMIN'),
  LotesPTController.create
);

// Cambio de estado de lote (Cuarentena, Bloqueo, Aprobación por Calidad o Supervisor - Auditor solo consulta)
router.patch(
  '/:codigo/estado',
  authorizeRoles('SUPERVISOR', 'ADMIN'),
  LotesPTController.cambiarEstado
);

module.exports = router;
