const express = require('express');
const router = express.Router();
const TrazabilidadController = require('../controllers/trazabilidad.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Consulta de trazabilidad hacia atrás (Backward Traceability) - Soporta ambas variantes de URL
router.get('/backward/:codigo', TrazabilidadController.getGenealogiaAtras);
router.get('/lote-pt/:codigo/backward', TrazabilidadController.getGenealogiaAtras);

// Consulta de trazabilidad hacia adelante (Forward Traceability / Recall) - Soporta ambas variantes de URL
router.get('/forward/:codigo', TrazabilidadController.getGenealogiaAdelante);
router.get('/lote-mp/:codigo/forward', TrazabilidadController.getGenealogiaAdelante);

// Bloqueo preventivo masivo ante protocolo de Recall (KIT AVZ-03)
router.post(
  '/recall/bloqueo-preventivo',
  authorizeRoles('SUPERVISOR', 'ADMIN'),
  TrazabilidadController.bloqueoPreventivoRecall
);

module.exports = router;
